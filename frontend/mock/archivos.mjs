// Archivos de los reportes del backend simulado: PDF con tabla y planilla .xlsx, sin dependencias.
// Imitan lo que genera el backend real (OpenPDF y fastexcel) para poder revisar las descargas.
import { deflateRawSync } from 'node:zlib';

const PRIMARIO = [10 / 255, 97 / 255, 112 / 255];

// ---------- PDF ----------

/** Texto en WinAnsi (latin1) para que las tildes y la ñ salgan bien con Helvetica. */
const latin1 = (texto) =>
  String(texto ?? '')
    .replace(/[^\x20-\xff]/g, '')
    .replace(/[\\()]/g, (c) => `\\${c}`);

// Ancho aproximado de un carácter de Helvetica, en em: la negrita en mayúsculas es más ancha.
const ANCHO_NORMAL = 0.52;
const ANCHO_NEGRITA = 0.7;

/** Corta el texto para que entre en el ancho de la columna. */
function ajustar(texto, ancho, tamano, factor) {
  const maximo = Math.floor(ancho / (tamano * factor));
  const limpio = String(texto ?? '');
  return limpio.length > maximo ? `${limpio.slice(0, Math.max(1, maximo - 3))}...` : limpio;
}

/** filas[0] son los encabezados; `numericas` son los índices de columnas alineadas a la derecha. */
export function pdfTabla(titulo, subtitulo, filas, numericas = []) {
  const [encabezados, ...datos] = filas;
  const ANCHO = 842;
  const ALTO = 595;
  const MARGEN = 36;
  const ALTO_FILA = 16;
  const util = ANCHO - MARGEN * 2;
  // El encabezado va en negrita y mayúsculas: ocupa más que la misma cantidad de letras normales.
  const largos = encabezados.map((encabezado, c) =>
    Math.min(
      40,
      Math.max(
        (String(encabezado).length * ANCHO_NEGRITA) / ANCHO_NORMAL,
        ...datos.map((f) => String(f[c] ?? '').length),
        4,
      ),
    ),
  );
  // Cada columna pide lo que ocupa su texto más 10 pt de margen. Si no entra todo, las columnas
  // cortas conservan su ancho y solo se achican las largas (medicamento, observaciones).
  const naturales = largos.map((l) => l * 8 * ANCHO_NORMAL + 10);
  const suma = (lista) => lista.reduce((a, b) => a + b, 0);
  const CORTA = 90;
  let anchos = naturales;
  if (suma(naturales) > util) {
    const fijas = suma(naturales.filter((n) => n <= CORTA));
    const largas = suma(naturales.filter((n) => n > CORTA));
    anchos = naturales.map((n) => (n <= CORTA ? n : (n / largas) * (util - fijas)));
  } else {
    anchos = naturales.map((n) => (n / suma(naturales)) * util);
  }
  const xs = anchos.map((_, i) => MARGEN + anchos.slice(0, i).reduce((a, b) => a + b, 0));

  const porPagina = Math.floor((ALTO - 150) / ALTO_FILA);
  const paginas = [];
  for (let i = 0; i === 0 || i < datos.length; i += porPagina) paginas.push(datos.slice(i, i + porPagina));

  const texto = (x, y, tamano, contenido, negrita = false, color = '0.08 0.14 0.18') =>
    `BT ${color} rg /${negrita ? 'F2' : 'F1'} ${tamano} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${latin1(contenido)}) Tj ET`;
  const celda = (c, y, valor, tamano, negrita, color) => {
    const factor = negrita ? ANCHO_NEGRITA : ANCHO_NORMAL;
    const contenido = ajustar(valor, anchos[c] - 8, tamano, factor);
    const x = numericas.includes(c) ? xs[c] + anchos[c] - 4 - contenido.length * tamano * factor : xs[c] + 4;
    return texto(x, y, tamano, contenido, negrita, color);
  };

  const contenidos = paginas.map((pagina, n) => {
    const partes = [
      texto(MARGEN, ALTO - 50, 9, 'FARMACIA HOSPITALARIA', true, PRIMARIO.join(' ')),
      texto(MARGEN, ALTO - 70, 16, titulo, true),
      `${PRIMARIO.join(' ')} RG 1.5 w ${MARGEN} ${ALTO - 80} m ${ANCHO - MARGEN} ${ALTO - 80} l S`,
      texto(MARGEN, ALTO - 96, 9, subtitulo, false, '0.3 0.36 0.42'),
    ];
    let y = ALTO - 125;
    partes.push(`${PRIMARIO.join(' ')} rg ${MARGEN} ${y - 5} ${util} ${ALTO_FILA} re f`);
    encabezados.forEach((e, c) => partes.push(celda(c, y, String(e).toUpperCase(), 7.5, true, '1 1 1')));
    if (pagina.length === 0)
      partes.push(texto(MARGEN + 4, y - ALTO_FILA, 9, 'No hay datos para los filtros elegidos.'));
    pagina.forEach((fila, i) => {
      y -= ALTO_FILA;
      if (i % 2 === 1) partes.push(`0.97 0.98 0.98 rg ${MARGEN} ${y - 5} ${util} ${ALTO_FILA} re f`);
      partes.push(`0.87 0.9 0.93 RG 0.5 w ${MARGEN} ${y - 5} m ${ANCHO - MARGEN} ${y - 5} l S`);
      fila.forEach((valor, c) => partes.push(celda(c, y, valor, 8)));
    });
    partes.push(
      texto(
        MARGEN,
        24,
        8,
        'Farmacia Hospitalaria  ·  Generado por el backend simulado',
        false,
        '0.3 0.36 0.42',
      ),
    );
    partes.push(
      texto(ANCHO - MARGEN - 50, 24, 8, `Página ${n + 1} de ${paginas.length}`, false, '0.3 0.36 0.42'),
    );
    return partes.join('\n');
  });

  // Objetos: 1 catálogo, 2 páginas, 3 y 4 fuentes, después una página y su contenido por cada hoja.
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${contenidos.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${contenidos.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];
  contenidos.forEach((contenido, i) => {
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
    );
    objetos.push(`<< /Length ${Buffer.byteLength(contenido, 'latin1')} >>\nstream\n${contenido}\nendstream`);
  });
  let pdf = '%PDF-1.4\n';
  const posiciones = objetos.map((objeto, i) => {
    const posicion = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`;
    return posicion;
  });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  pdf += posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

// ---------- XLSX ----------

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = TABLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** ZIP con compresión deflate: lo mínimo que necesita un .xlsx. */
function zip(archivos) {
  const locales = [];
  const centrales = [];
  let desplazamiento = 0;
  for (const [nombre, texto] of Object.entries(archivos)) {
    const datos = Buffer.from(texto, 'utf8');
    const comprimido = deflateRawSync(datos);
    const nombreBytes = Buffer.from(nombre, 'utf8');
    const crc = crc32(datos);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nombreBytes.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nombreBytes.length, 28);
    central.writeUInt32LE(desplazamiento, 42);
    locales.push(local, nombreBytes, comprimido);
    centrales.push(central, nombreBytes);
    desplazamiento += 30 + nombreBytes.length + comprimido.length;
  }
  const directorio = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(Object.keys(archivos).length, 8);
  fin.writeUInt16LE(Object.keys(archivos).length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  return Buffer.concat([...locales, directorio, fin]);
}

const xml = (texto) =>
  String(texto ?? '').replace(
    /[<>&"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c],
  );

const columna = (indice) => String.fromCharCode(65 + indice);

/** Fecha dd/mm/aaaa (con hora opcional) al número de serie de Excel. */
function serieExcel(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/.exec(texto);
  if (!partes) return null;
  const [, d, m, a, h = '0', min = '0'] = partes;
  const utc = Date.UTC(Number(a), Number(m) - 1, Number(d), Number(h), Number(min));
  return utc / 86_400_000 + 25_569;
}

/** filas[0] son los encabezados; `numericas` son los índices de columnas con cantidades. */
export function xlsx(titulo, subtitulo, filas, numericas = []) {
  const [encabezados, ...datos] = filas;
  const ultima = columna(encabezados.length - 1);
  const FILA_ENCABEZADO = 4;
  const texto = (ref, valor, estilo) =>
    `<c r="${ref}" t="inlineStr" s="${estilo}"><is><t xml:space="preserve">${xml(valor)}</t></is></c>`;

  const renglones = [
    `<row r="1">${texto('A1', titulo, 1)}</row>`,
    `<row r="2">${texto('A2', subtitulo, 2)}</row>`,
    `<row r="${FILA_ENCABEZADO}">${encabezados.map((e, c) => texto(`${columna(c)}${FILA_ENCABEZADO}`, e, 3)).join('')}</row>`,
  ];
  datos.forEach((fila, f) => {
    const r = FILA_ENCABEZADO + 1 + f;
    const celdas = fila.map((valor, c) => {
      const ref = `${columna(c)}${r}`;
      const v = String(valor ?? '');
      if (v === '') return '';
      if (numericas.includes(c) && /^-?\d+$/.test(v)) return `<c r="${ref}" s="0"><v>${v}</v></c>`;
      const serie = serieExcel(v);
      if (serie !== null) return `<c r="${ref}" s="${v.includes(':') ? 5 : 4}"><v>${serie}</v></c>`;
      return texto(ref, v, 0);
    });
    renglones.push(`<row r="${r}">${celdas.join('')}</row>`);
  });

  const anchos = encabezados
    .map((_, c) => {
      const largo = Math.max(...filas.map((f) => String(f[c] ?? '').length));
      return `<col min="${c + 1}" max="${c + 1}" width="${Math.min(Math.max(largo + 3, 10), 60)}" customWidth="1"/>`;
    })
    .join('');
  const filtro = datos.length
    ? `<autoFilter ref="A${FILA_ENCABEZADO}:${ultima}${FILA_ENCABEZADO + datos.length}"/>`
    : '';
  const hoja = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${FILA_ENCABEZADO}" topLeftCell="A${FILA_ENCABEZADO + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${anchos}</cols><sheetData>${renglones.join('')}</sheetData>${filtro}</worksheet>`;

  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF0A6170"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF4D5D6B"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0A6170"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const nombreHoja = xml(titulo.slice(0, 31));
  return zip({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nombreHoja}" sheetId="1" r:id="rId1"/></sheets>${datos.length ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${nombreHoja}'!$A$${FILA_ENCABEZADO}:$${ultima}$${FILA_ENCABEZADO + datos.length}</definedName></definedNames>` : ''}</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': hoja,
    'xl/styles.xml': estilos,
  });
}
