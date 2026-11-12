// Genera los PDF de la entrega a partir de los Markdown de documentos/.
// Uso (desde esta carpeta): npm install  (la primera vez)  y después  npm run pdf
// Los PDF quedan en documentos/pdf/. Los diagramas Mermaid se dibujan con Chromium.

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { chromium } from 'playwright';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DOCUMENTOS = path.resolve(AQUI, '..');
const SALIDA = path.join(DOCUMENTOS, 'pdf');
const MERMAID = path.join(AQUI, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');
// El mismo escudo que el logo del sistema (frontend/public/favicon.svg).
const ESCUDO = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="escudo" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#1bb5a9"/><stop offset="1" stop-color="#0a6170"/></linearGradient></defs>
  <path fill="url(#escudo)" d="M20 2 35 7.5V19c0 9.4-6.4 16.4-15 19C11.4 35.4 5 28.4 5 19V7.5Z"/>
  <path fill="none" stroke="#fff" stroke-opacity=".45" d="M20 5.2 32 9.6V19c0 7.8-5.2 13.7-12 16-6.8-2.3-12-8.2-12-16V9.6Z"/>
  <rect fill="#fff" x="16.5" y="10" width="7" height="18" rx="1.6"/><rect fill="#fff" x="11" y="15.5" width="18" height="7" rx="1.6"/></svg>`;
const SUBTITULO = 'Sistema de Gestión de Stock — Farmacia Hospitalaria';

const carpeta = (dir, nombres) => nombres.map((n) => `${dir}/${n}`);

const PDFS = [
  {
    salida: '01-informe-final.pdf',
    titulo: 'Informe final',
    portada: false,
    archivos: ['tesis/informe-final.md'],
  },
  {
    salida: '02-carpeta-del-proyecto.pdf',
    titulo: 'Carpeta del proyecto',
    descripcion: 'Documentación técnica: requisitos, casos de uso, arquitectura, datos, API, seguridad, pruebas, instalación, planificación y presupuesto.',
    portada: true,
    archivos: carpeta('carpeta-del-proyecto', [
      '01-relevamiento-y-requisitos.md',
      '02-casos-de-uso.md',
      '03-arquitectura.md',
      '04-modelo-de-datos.md',
      '05-api.md',
      '06-seguridad.md',
      '07-plan-de-pruebas.md',
      '08-instalacion-y-despliegue.md',
      '09-planificacion-y-presupuesto.md',
      '10-glosario.md',
    ]),
  },
  {
    salida: '03-manual-de-usuario.pdf',
    titulo: 'Manual de usuario',
    descripcion: 'Cómo usar el sistema pantalla por pantalla.',
    portada: true,
    archivos: ['manual-de-usuario/manual-de-usuario.md'],
  },
  {
    salida: '04-guion-de-defensa.pdf',
    titulo: 'Guion de la defensa',
    descripcion: 'Presentación, demostración en vivo y preguntas probables del tribunal.',
    portada: true,
    archivos: ['defensa/guion-de-defensa.md'],
  },
  {
    salida: '05-carpeta-de-estudio.pdf',
    titulo: 'Carpeta de estudio',
    descripcion: 'Todo el proyecto explicado desde cero, con el código real.',
    portada: true,
    archivos: carpeta('estudio', [
      '00-como-usar-esta-carpeta.md',
      '01-el-proyecto-en-un-vistazo.md',
      '02-repaso-de-programacion.md',
      '03-como-funciona-la-web.md',
      '04-bases-de-datos-y-sql.md',
      '05-java-desde-cero.md',
      '06-spring-boot.md',
      '07-recorrido-del-backend.md',
      '08-seguridad-explicada.md',
      '09-reglas-de-negocio.md',
      '10-javascript-y-typescript.md',
      '11-react.md',
      '12-recorrido-del-frontend.md',
      '13-docker-y-entornos.md',
      '14-pruebas.md',
      '15-git-y-herramientas.md',
      '16-glosario.md',
      '17-autoevaluacion.md',
    ]),
  },
];

// En qué PDF quedó cada Markdown, para convertir los enlaces entre documentos.
const PDF_DE = new Map();
for (const pdf of PDFS) for (const archivo of pdf.archivos) PDF_DE.set(archivo, pdf);

/** Igual que GitHub: minúsculas, sin puntuación, espacios a guiones. */
function slug(texto) {
  return texto
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

const claveDe = (archivo) => path.basename(archivo, '.md');

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertir(markdown, archivo, pdf) {
  const clave = claveDe(archivo);
  const combinado = pdf.archivos.length > 1;
  const prefijo = combinado ? `${clave}--` : '';
  const directorio = path.posix.dirname(archivo);
  const usados = new Map();
  let primerTitulo = null;

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const html = this.parser.parseInline(tokens);
        let id = prefijo + slug(text);
        const veces = usados.get(id) ?? 0;
        usados.set(id, veces + 1);
        if (veces) id = `${id}-${veces}`;
        if (depth === 1 && !primerTitulo) primerTitulo = { texto: text.replace(/[`*]/g, ''), id };
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if (lang === 'mermaid') return `<div class="diagrama"><pre class="mermaid">${escapar(text)}</pre></div>\n`;
        return `<pre><code>${escapar(text)}</code></pre>\n`;
      },
      link({ href, tokens }) {
        const texto = this.parser.parseInline(tokens);
        if (/^(https?:|mailto:)/.test(href)) return `<a href="${href}">${texto}</a>`;
        if (href.startsWith('#')) return `<a href="#${prefijo}${href.slice(1)}">${texto}</a>`;
        const [ruta, ancla] = href.split('#');
        const destino = path.posix.normalize(path.posix.join(directorio, ruta));
        const otroPdf = PDF_DE.get(destino);
        if (otroPdf === pdf) {
          const p = pdf.archivos.length > 1 ? `${claveDe(destino)}--` : '';
          return `<a href="#${ancla ? p + ancla : `doc-${claveDe(destino)}`}">${texto}</a>`;
        }
        if (otroPdf) return `${texto} <span class="ref">(en «${otroPdf.titulo}»)</span>`;
        return texto;
      },
      image({ href, text }) {
        const absoluta = path.resolve(DOCUMENTOS, directorio, href);
        if (!existsSync(absoluta)) return `<em>[imagen no encontrada: ${escapar(href)}]</em>`;
        return `<figure><img src="${pathToFileURL(absoluta).href}" alt="${escapar(text)}"><figcaption>${escapar(text)}</figcaption></figure>`;
      },
    },
  });

  let html = marked.parse(markdown);
  // En papel no se puede hacer clic: las respuestas plegadas se muestran abiertas.
  html = html.replace(/<details>/g, '<details open>');
  return { html: `<section class="documento" id="doc-${clave}">${html}</section>`, titulo: primerTitulo };
}

const ESTILOS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
* { box-sizing: border-box; }
html { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 10.2pt; color: #14232e; line-height: 1.5; }
body { margin: 0; }
h1, h2, h3, h4 { color: #0c2b36; line-height: 1.25; break-after: avoid; page-break-after: avoid; }
h1 { font-size: 20pt; margin: 0 0 10pt; padding-bottom: 6pt; border-bottom: 2.5pt solid #0a6170; }
h2 { font-size: 14pt; margin: 18pt 0 6pt; color: #0a6170; }
h3 { font-size: 11.5pt; margin: 14pt 0 4pt; }
h4 { font-size: 10.5pt; margin: 10pt 0 4pt; }
p, li { orphans: 3; widows: 3; }
a { color: #0a6170; text-decoration: none; }
.ref { color: #4d5d6b; font-size: 0.9em; font-style: italic; }
.documento + .documento { break-before: page; page-break-before: always; }
table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 8.8pt; break-inside: auto; }
thead { display: table-header-group; }
thead:not(:has(th:not(:empty))) { display: none; }
tr { break-inside: avoid; page-break-inside: avoid; }
th, td { border: 0.6pt solid #b9c6cf; padding: 3pt 5pt; vertical-align: top; text-align: left; }
th { background: #e2f1f2; color: #0c2b36; font-weight: 600; }
tbody tr:nth-child(even) td { background: #f7f9fb; }
code { font-family: Consolas, "Cascadia Mono", monospace; font-size: 0.88em; background: #eef2f5; padding: 0 2pt; border-radius: 2pt; }
pre { background: #f3f6f8; border: 0.6pt solid #dfe6ec; border-left: 3pt solid #0a6170; padding: 6pt 8pt; border-radius: 3pt;
      white-space: pre-wrap; word-break: break-word; font-size: 8.3pt; line-height: 1.4; break-inside: avoid; page-break-inside: avoid; }
pre code { background: none; padding: 0; font-size: inherit; }
blockquote { margin: 8pt 0; padding: 5pt 10pt; border-left: 3pt solid #13a39a; background: #e7f5ec; color: #14232e; break-inside: avoid; }
blockquote p { margin: 2pt 0; }
.diagrama { margin: 8pt 0 12pt; text-align: center; break-inside: avoid; page-break-inside: avoid; }
.diagrama pre.mermaid { background: none; border: 0; padding: 0; white-space: pre; font-size: 9pt; }
.diagrama svg { max-width: 100%; height: auto; max-height: 230mm; }
figure { margin: 8pt 0 12pt; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; max-height: 120mm; border: 0.6pt solid #dfe6ec; border-radius: 3pt; }
figcaption { font-size: 8.5pt; color: #4d5d6b; margin-top: 3pt; }
details { margin: 4pt 0 8pt; padding: 4pt 8pt; border: 0.6pt solid #dfe6ec; border-radius: 3pt; break-inside: avoid; }
summary { font-weight: 600; list-style: none; }
summary::-webkit-details-marker { display: none; }
hr { border: 0; border-top: 0.6pt solid #dfe6ec; margin: 12pt 0; }
input[type=checkbox] { margin-right: 4pt; }
.portada { height: 255mm; display: flex; flex-direction: column; justify-content: center; break-after: page; page-break-after: always; }
.portada .marca { display: flex; align-items: center; gap: 10pt; color: #0a6170; font-weight: 600; font-size: 12pt; margin-bottom: 40pt; }
.portada .marca svg { width: 40pt; height: 40pt; }
.portada h1 { font-size: 34pt; border: 0; margin: 0 0 8pt; padding: 0; }
.portada .sub { font-size: 14pt; color: #0a6170; margin: 0 0 18pt; }
.portada .desc { font-size: 11pt; color: #4d5d6b; max-width: 140mm; }
.portada .pie { margin-top: 80pt; font-size: 10pt; color: #4d5d6b; border-top: 1pt solid #dfe6ec; padding-top: 10pt; }
.indice { break-after: page; page-break-after: always; }
.indice ol { padding-left: 16pt; font-size: 11pt; }
.indice li { margin: 4pt 0; }
`;

function portada(pdf) {
  return `<section class="portada">
    <div class="marca">${ESCUDO}Farmacia Hospitalaria</div>
    <h1>${pdf.titulo}</h1>
    <p class="sub">${SUBTITULO}</p>
    ${pdf.descripcion ? `<p class="desc">${pdf.descripcion}</p>` : ''}
    <div class="pie">Trabajo Final Integrador — Tecnicatura Universitaria en Programación — UTN<br>Noviembre de 2026</div>
  </section>`;
}

function indice(titulos) {
  const items = titulos.map((t) => `<li><a href="#${t.id}">${escapar(t.texto)}</a></li>`).join('');
  return `<section class="indice"><h1>Índice</h1><ol>${items}</ol></section>`;
}

async function armarHtml(pdf) {
  const partes = [];
  const titulos = [];
  for (const archivo of pdf.archivos) {
    const markdown = await readFile(path.join(DOCUMENTOS, archivo), 'utf8');
    const { html, titulo } = convertir(markdown, archivo, pdf);
    partes.push(html);
    if (titulo) titulos.push(titulo);
  }
  const cabecera = (pdf.portada ? portada(pdf) : '') + (pdf.archivos.length > 1 ? indice(titulos) : '');
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><title>${pdf.titulo}</title>
    <style>${ESTILOS}</style><script src="${pathToFileURL(MERMAID).href}"></script>
    <script>mermaid.initialize({ startOnLoad: false });</script></head>
    <body>${cabecera}${partes.join('\n')}</body></html>`;
}

async function dibujarDiagramas(pagina) {
  return pagina.evaluate(async () => {
    /* global mermaid */
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      flowchart: { htmlLabels: true, useMaxWidth: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: true },
    });
    const errores = [];
    const bloques = [...document.querySelectorAll('pre.mermaid')];
    for (const [i, bloque] of bloques.entries()) {
      try {
        const { svg } = await mermaid.render(`diagrama-${i}`, bloque.textContent);
        bloque.outerHTML = svg;
      } catch (error) {
        errores.push(`${bloque.textContent.split('\n')[0]}… → ${error.message ?? error}`);
      }
    }
    return { total: bloques.length, errores };
  });
}

const pieDePagina = (titulo) => `
  <div style="width:100%; font-size:7.5pt; color:#4d5d6b; padding:0 16mm; display:flex; justify-content:space-between; font-family:Segoe UI, Arial;">
    <span>${titulo} · ${SUBTITULO}</span>
    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>`;

async function main() {
  await mkdir(SALIDA, { recursive: true });
  const temporal = path.join(tmpdir(), `farmacia-pdf-${process.pid}`);
  await mkdir(temporal, { recursive: true });
  const navegador = await chromium.launch();
  let huboErrores = false;
  try {
    for (const pdf of PDFS) {
      const archivoHtml = path.join(temporal, pdf.salida.replace('.pdf', '.html'));
      await writeFile(archivoHtml, await armarHtml(pdf), 'utf8');
      const pagina = await navegador.newPage();
      await pagina.goto(pathToFileURL(archivoHtml).href, { waitUntil: 'load' });
      const { total, errores } = await dibujarDiagramas(pagina);
      await pagina.evaluate(() => document.fonts.ready);
      await pagina.pdf({
        path: path.join(SALIDA, pdf.salida),
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: pieDePagina(pdf.titulo),
        margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
        outline: true,
        tagged: true,
      });
      await pagina.close();
      console.log(`✓ ${pdf.salida} (${total} diagramas)`);
      for (const error of errores) {
        huboErrores = true;
        console.error(`  ✗ diagrama con error: ${error}`);
      }
    }
  } finally {
    await navegador.close();
    // CONSERVAR_HTML=1 deja los HTML intermedios para revisar el diseño.
    if (process.env.CONSERVAR_HTML) console.log(`HTML intermedios en ${temporal}`);
    else await rm(temporal, { recursive: true, force: true });
  }
  if (huboErrores) process.exitCode = 1;
}

await main();
