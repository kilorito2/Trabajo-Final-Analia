// Backend SIMULADO para desarrollar el frontend mientras el real no existe.
// Implementa el contrato provisorio (contrato/openapi-provisorio.yaml) con datos en memoria.
// Solo para desarrollo: no se incluye en el build. Se borra cuando el backend esté listo.
// Uso: npm run mock  (escucha en http://localhost:8080, igual que el backend real)

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { pdfTabla, xlsx } from './archivos.mjs';

const PUERTO = Number(process.env.PUERTO_MOCK ?? 8080);
const DIAS_POR_VENCER = 30;
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
const DEMORA_MS = 150;
const PASSWORD_DEMO = 'demo1234';

// ---------- Fechas (zona de Argentina, igual que el backend) ----------

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const hoy = () => formatoDia.format(new Date());
const sumarDias = (fecha, dias) => {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
};
const diasEntre = (desde, hasta) =>
  Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
const ahora = () => new Date().toISOString();
const instanteHaceDias = (dias, hora = 10) => {
  const fecha = new Date(Date.now() - dias * 86_400_000);
  fecha.setUTCHours(hora + 3, 15, 0, 0);
  return fecha.toISOString();
};

// ---------- Datos ----------

const PERMISOS = {
  ADMIN: [
    'LECTURA',
    'CATALOGO_EDITAR',
    'STOCK_INGRESAR',
    'STOCK_BAJA_AJUSTE',
    'TRANSFERENCIA_CREAR',
    'USUARIO_GESTIONAR',
  ],
  FARMACEUTICO: ['LECTURA', 'CATALOGO_EDITAR', 'STOCK_INGRESAR', 'STOCK_BAJA_AJUSTE', 'TRANSFERENCIA_CREAR'],
  CONSULTA: ['LECTURA'],
};

let secuencia = 1;
const nuevoId = () => secuencia++;

const usuarios = [
  { username: 'admin', nombreCompleto: 'Analía Gómez', rol: 'ADMIN' },
  { username: 'farmaceutico', nombreCompleto: 'Martín Sosa', rol: 'FARMACEUTICO' },
  { username: 'consulta', nombreCompleto: 'Lucía Benítez', rol: 'CONSULTA' },
].map((u) => ({
  ...u,
  id: nuevoId(),
  password: PASSWORD_DEMO,
  activo: true,
  creadoEn: instanteHaceDias(90),
}));

const areas = [
  'Guardia',
  'UTI',
  'Pediatría',
  'Neonatología',
  'Quirófano',
  'Internación Clínica',
  'Internación Quirúrgica',
  'Consultorios Externos',
].map((nombre) => ({ id: nuevoId(), nombre, activo: true }));

const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
function cuitValido(base) {
  const suma = PESOS_CUIT.reduce((t, p, i) => t + p * Number(base[i]), 0);
  const resto = 11 - (suma % 11);
  if (resto === 10) return null;
  return `${base}${resto === 11 ? 0 : resto}`;
}
const proveedores = [
  ['Droguería del Sur S.A.', '3071234567', '011 4302-1100', 'ventas@drogueriadelsur.com.ar'],
  ['Distribuidora Médica Norte S.R.L.', '3070891234', '0381 422-5500', 'pedidos@dmnorte.com.ar'],
  ['Laboratorio Andino S.A.', '3065432109', '0261 425-7788', null],
  ['Suministros Hospitalarios Pampa S.A.', '3071122334', null, 'contacto@shpampa.com.ar'],
].map(([razonSocial, base, telefono, email]) => ({
  id: nuevoId(),
  razonSocial,
  cuit: cuitValido(base) ?? cuitValido(`${base.slice(0, 9)}8`),
  telefono,
  email,
  activo: true,
}));

const medicamentos = [
  ['AMX500', 'Amoxicilina', 'comprimidos 500 mg', 200],
  ['CEF1G', 'Ceftriaxona', 'frasco ampolla 1 g', 80],
  ['ENO40', 'Enoxaparina', 'jeringa prellenada 40 mg', 60],
  ['SF500', 'Solución fisiológica 0,9 %', 'sachet 500 ml', 300],
  ['PAR500', 'Paracetamol', 'comprimidos 500 mg', 250],
  ['IBU400', 'Ibuprofeno', 'comprimidos 400 mg', 150],
  ['DIP2G', 'Dipirona', 'ampolla 2 g', 100],
  ['OME20', 'Omeprazol', 'cápsulas 20 mg', 120],
  ['RAN50', 'Ranitidina', 'ampolla 50 mg', 40],
  ['MET10', 'Metoclopramida', 'ampolla 10 mg', 60],
  ['DEX8', 'Dexametasona', 'ampolla 8 mg', 50],
  ['FUR20', 'Furosemida', 'ampolla 20 mg', 60],
  ['HEP5', 'Heparina sódica', 'frasco ampolla 5000 UI/ml', 30],
  ['INS100', 'Insulina NPH', 'frasco ampolla 100 UI/ml', 25],
  ['SAL100', 'Salbutamol', 'aerosol 100 mcg', 40],
  ['AMI1G', 'Amikacina', 'ampolla 500 mg', 30],
  ['VAN1G', 'Vancomicina', 'frasco ampolla 1 g', 20],
  ['MID15', 'Midazolam', 'ampolla 15 mg', 30],
  ['KET50', 'Ketorolac', 'ampolla 30 mg', 60],
  ['LID2', 'Lidocaína 2 %', 'frasco ampolla 20 ml', 20],
  ['DXT5', 'Dextrosa 5 %', 'sachet 500 ml', 150],
  ['RIN500', 'Ringer lactato', 'sachet 500 ml', 120],
  ['CLX500', 'Cefalexina', 'cápsulas 500 mg', 100],
  ['ATR1', 'Atropina', 'ampolla 1 mg', 20],
  ['ADR1', 'Adrenalina', 'ampolla 1 mg', 20],
].map(([codigo, nombre, presentacion, stockMinimo]) => ({
  id: nuevoId(),
  codigo,
  nombre,
  presentacion,
  stockMinimo,
  activo: true,
}));

const lotes = [];
const movimientos = [];
const transferencias = [];

const nombreMedicamento = (m) => `${m.nombre} ${m.presentacion}`;
const buscar = (lista, id) => lista.find((x) => x.id === Number(id));

function crearLote({
  medicamento,
  proveedor,
  numeroLote,
  fechaVencimiento,
  cantidad,
  usuario,
  fechaIngreso,
}) {
  const lote = {
    id: nuevoId(),
    medicamentoId: medicamento.id,
    proveedorId: proveedor.id,
    numeroLote,
    fechaVencimiento,
    cantidadInicial: cantidad,
    cantidadActual: cantidad,
    fechaIngreso,
  };
  lotes.push(lote);
  registrarMovimiento(lote, 'INGRESO', cantidad, usuario, { fechaHora: `${fechaIngreso}T12:00:00-03:00` });
  return lote;
}

function registrarMovimiento(lote, tipo, cantidad, usuario, extra = {}) {
  movimientos.push({
    id: nuevoId(),
    fechaHora: extra.fechaHora ?? ahora(),
    tipo,
    cantidad,
    saldoResultante: lote.cantidadActual,
    loteId: lote.id,
    usuarioId: usuario.id,
    transferenciaId: extra.transferenciaId ?? null,
    motivo: extra.motivo ?? null,
  });
}

// Datos iniciales: vencimientos relativos a hoy para que las cuatro alertas tengan datos.
function cargarDatosDemo() {
  const admin = usuarios[0];
  const hoyTexto = hoy();
  const planes = {
    AMX500: [
      [400, 240],
      [180, 20],
    ],
    CEF1G: [
      [60, 300],
      [25, 12],
    ],
    ENO40: [[40, 200]],
    SF500: [
      [800, 500],
      [300, 18],
    ],
    PAR500: [[600, 400]],
    IBU400: [[90, 365]],
    DIP2G: [
      [150, 210],
      [40, -5],
    ],
    OME20: [[300, 280]],
    RAN50: [],
    MET10: [[45, 150]],
    DEX8: [[120, 7]],
    FUR20: [[200, 330]],
    HEP5: [[20, -12]],
    INS100: [[60, 90]],
    SAL100: [[35, 25]],
    AMI1G: [[80, 400]],
    VAN1G: [],
    MID15: [[25, 160]],
    KET50: [[220, 260]],
    LID2: [[30, 3]],
    DXT5: [[500, 300]],
    RIN500: [[90, 250]],
    CLX500: [[400, 190]],
    ATR1: [[18, 120]],
    ADR1: [
      [50, -2],
      [24, 240],
    ],
  };
  let numero = 2300;
  for (const medicamento of medicamentos) {
    for (const [i, [cantidad, dias]] of (planes[medicamento.codigo] ?? []).entries()) {
      crearLote({
        medicamento,
        proveedor: proveedores[(medicamento.id + i) % proveedores.length],
        numeroLote: `L${numero++}`,
        fechaVencimiento: sumarDias(hoyTexto, dias),
        cantidad,
        usuario: admin,
        fechaIngreso: sumarDias(hoyTexto, -40 - i * 5),
      });
    }
  }
  const pedidos = [
    [
      28,
      'Guardia',
      [
        ['SF500', 60],
        ['PAR500', 40],
      ],
    ],
    [
      25,
      'UTI',
      [
        ['ENO40', 10],
        ['CEF1G', 8],
      ],
    ],
    [
      21,
      'Pediatría',
      [
        ['AMX500', 30],
        ['IBU400', 20],
      ],
    ],
    [
      18,
      'Quirófano',
      [
        ['KET50', 30],
        ['LID2', 6],
        ['DXT5', 40],
      ],
    ],
    [
      15,
      'Guardia',
      [
        ['DIP2G', 25],
        ['MET10', 10],
      ],
    ],
    [
      12,
      'Internación Clínica',
      [
        ['OME20', 40],
        ['SF500', 80],
      ],
    ],
    [
      9,
      'UTI',
      [
        ['MID15', 5],
        ['FUR20', 20],
      ],
    ],
    [
      6,
      'Guardia',
      [
        ['SF500', 100],
        ['RIN500', 30],
      ],
    ],
    [4, 'Neonatología', [['DXT5', 20]]],
    [
      2,
      'Internación Quirúrgica',
      [
        ['CLX500', 60],
        ['KET50', 20],
      ],
    ],
    [
      1,
      'Consultorios Externos',
      [
        ['PAR500', 50],
        ['SAL100', 5],
      ],
    ],
    [
      0,
      'Guardia',
      [
        ['AMX500', 40],
        ['DIP2G', 10],
      ],
    ],
  ];
  for (const [diasAtras, nombreArea, items] of pedidos) {
    transferir(
      {
        areaId: areas.find((a) => a.nombre === nombreArea).id,
        observaciones: diasAtras === 18 ? 'Reposición para cirugías programadas.' : null,
        items: items.map(([codigo, cantidad]) => ({
          medicamentoId: medicamentos.find((m) => m.codigo === codigo).id,
          cantidad,
        })),
      },
      usuarios[diasAtras % 2],
      instanteHaceDias(diasAtras, 9 + (diasAtras % 8)),
    );
  }
}

// ---------- Cálculos (los mismos criterios que Back_v2 §6) ----------

const vencido = (lote) => lote.fechaVencimiento < hoy();

function estadoLote(lote) {
  if (lote.cantidadActual === 0) return 'AGOTADO';
  if (vencido(lote)) return 'VENCIDO';
  if (diasEntre(hoy(), lote.fechaVencimiento) <= DIAS_POR_VENCER) return 'POR_VENCER';
  return 'VIGENTE';
}

const lotesDisponibles = (medicamentoId) =>
  lotes.filter((l) => l.medicamentoId === medicamentoId && l.cantidadActual > 0 && !vencido(l));

const ordenFefo = (a, b) =>
  a.fechaVencimiento.localeCompare(b.fechaVencimiento) ||
  a.fechaIngreso.localeCompare(b.fechaIngreso) ||
  a.id - b.id;

function stockTotal(medicamento) {
  return lotesDisponibles(medicamento.id).reduce((t, l) => t + l.cantidadActual, 0);
}

function estadoStock(medicamento) {
  const stock = stockTotal(medicamento);
  if (stock === 0) return 'SIN_STOCK';
  if (stock <= medicamento.stockMinimo) return 'STOCK_BAJO';
  return 'OK';
}

function aMedicamento(m) {
  const disponibles = lotesDisponibles(m.id).sort(ordenFefo);
  return {
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    presentacion: m.presentacion,
    stockMinimo: m.stockMinimo,
    stockTotal: stockTotal(m),
    estadoStock: estadoStock(m),
    proximoVencimiento: disponibles[0]?.fechaVencimiento ?? null,
    activo: m.activo,
  };
}

function aLote(l) {
  const medicamento = buscar(medicamentos, l.medicamentoId);
  return {
    id: l.id,
    medicamentoId: l.medicamentoId,
    medicamento: nombreMedicamento(medicamento),
    proveedorId: l.proveedorId,
    proveedor: buscar(proveedores, l.proveedorId).razonSocial,
    numeroLote: l.numeroLote,
    fechaVencimiento: l.fechaVencimiento,
    cantidadInicial: l.cantidadInicial,
    cantidadActual: l.cantidadActual,
    fechaIngreso: l.fechaIngreso,
    estado: estadoLote(l),
    diasParaVencer: diasEntre(hoy(), l.fechaVencimiento),
  };
}

function aMovimiento(mov) {
  const lote = buscar(lotes, mov.loteId);
  return {
    id: mov.id,
    fechaHora: mov.fechaHora,
    tipo: mov.tipo,
    cantidad: mov.cantidad,
    saldoResultante: mov.saldoResultante,
    loteId: lote.id,
    numeroLote: lote.numeroLote,
    medicamento: nombreMedicamento(buscar(medicamentos, lote.medicamentoId)),
    usuario: buscar(usuarios, mov.usuarioId).username,
    transferenciaId: mov.transferenciaId,
    motivo: mov.motivo,
  };
}

const numeroTransferencia = (id) => `TR-${String(id).padStart(6, '0')}`;

function aTransferencia(t) {
  return {
    id: t.id,
    numero: numeroTransferencia(t.id),
    fechaHora: t.fechaHora,
    area: { id: t.areaId, nombre: buscar(areas, t.areaId).nombre },
    realizadaPor: { id: t.usuarioId, nombreCompleto: buscar(usuarios, t.usuarioId).nombreCompleto },
    observaciones: t.observaciones,
    detalle: t.detalle.map((d) => {
      const lote = buscar(lotes, d.loteId);
      return {
        medicamentoId: lote.medicamentoId,
        medicamento: nombreMedicamento(buscar(medicamentos, lote.medicamentoId)),
        loteId: lote.id,
        numeroLote: lote.numeroLote,
        fechaVencimiento: lote.fechaVencimiento,
        cantidad: d.cantidad,
      };
    }),
  };
}

function aResumenTransferencia(t) {
  return {
    id: t.id,
    numero: numeroTransferencia(t.id),
    fechaHora: t.fechaHora,
    area: buscar(areas, t.areaId).nombre,
    realizadaPor: buscar(usuarios, t.usuarioId).nombreCompleto,
    cantidadItems: new Set(t.detalle.map((d) => buscar(lotes, d.loteId).medicamentoId)).size,
    unidadesTotales: t.detalle.reduce((s, d) => s + d.cantidad, 0),
  };
}

const aProveedor = (p) => ({
  ...p,
  cuit: `${p.cuit.slice(0, 2)}-${p.cuit.slice(2, 10)}-${p.cuit.slice(10)}`,
  lotesConStock: lotes.filter((l) => l.proveedorId === p.id && l.cantidadActual > 0).length,
});

const aUsuario = ({ id, username, nombreCompleto, rol, activo, creadoEn }) => ({
  id,
  username,
  nombreCompleto,
  rol,
  activo,
  creadoEn,
});

const aSesion = (u) => ({
  id: u.id,
  username: u.username,
  nombreCompleto: u.nombreCompleto,
  rol: u.rol,
  permisos: PERMISOS[u.rol],
});

// ---------- Errores (ProblemDetail) ----------

class Problema extends Error {
  constructor(status, codigo, detail, extra = {}) {
    super(detail);
    this.cuerpo = { type: 'about:blank', title: TITULOS[status], status, detail, codigo, ...extra };
  }
}
const TITULOS = {
  400: 'Pedido inválido',
  401: 'No autenticado',
  403: 'Sin permiso',
  404: 'No encontrado',
  409: 'Conflicto',
};
const validacion = (errors) => new Problema(400, 'VALIDACION', 'Revisá los datos ingresados.', { errors });
const conflicto = (codigo, detail, extra) => new Problema(409, codigo, detail, extra);
const noEncontrado = (detail) => new Problema(404, 'NO_ENCONTRADO', detail);

function exigir(objeto, id, mensaje) {
  if (!objeto) throw noEncontrado(mensaje.replace('{id}', id));
  return objeto;
}

function validar(reglas) {
  const errors = {};
  for (const [campo, mensaje] of reglas) if (mensaje) errors[campo] = mensaje;
  if (Object.keys(errors).length) throw validacion(errors);
}

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const obligatorio = (valor) => (texto(valor) === '' ? 'Es obligatorio.' : null);
const enteroPositivo = (valor) =>
  Number.isInteger(valor) && valor > 0 ? null : 'Tiene que ser un entero mayor que 0.';

// ---------- Paginación, orden y filtros ----------

function paginar(lista, url, camposOrden, ordenPorDefecto) {
  const sort = url.searchParams.get('sort') ?? ordenPorDefecto;
  if (sort) {
    const [campo, direccion = 'asc'] = sort.split(',');
    if (!camposOrden[campo] || !['asc', 'desc'].includes(direccion)) {
      throw new Problema(400, 'ORDEN_INVALIDO', `No se puede ordenar por "${campo}".`);
    }
    const valor = camposOrden[campo];
    lista = [...lista].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const comparacion =
        va === null
          ? 1
          : vb === null
            ? -1
            : typeof va === 'number'
              ? va - vb
              : String(va).localeCompare(String(vb), 'es');
      return direccion === 'desc' ? -comparacion : comparacion;
    });
  }
  const size = Math.min(Math.max(Number(url.searchParams.get('size') ?? 20), 1), 100);
  const number = Math.max(Number(url.searchParams.get('page') ?? 0), 0);
  return {
    content: lista.slice(number * size, number * size + size),
    page: { number, size, totalElements: lista.length, totalPages: Math.ceil(lista.length / size) },
  };
}

function filtroActivo(lista, url) {
  const activo = url.searchParams.get('activo');
  return activo === null ? lista : lista.filter((x) => x.activo === (activo === 'true'));
}

const contiene = (valor, q) =>
  valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .includes(
      q
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase(),
    );

// ---------- Reglas de negocio ----------

function transferir(pedido, usuario, fechaHora = ahora()) {
  validar([
    ['areaId', Number.isInteger(pedido.areaId) ? null : 'Elegí un área.'],
    [
      'items',
      Array.isArray(pedido.items) && pedido.items.length > 0 ? null : 'Agregá al menos un medicamento.',
    ],
    ['observaciones', texto(pedido.observaciones).length > 500 ? 'Puede tener hasta 500 caracteres.' : null],
  ]);
  validar(pedido.items.map((item, i) => [`items[${i}].cantidad`, enteroPositivo(item.cantidad)]));

  const area = exigir(buscar(areas, pedido.areaId), pedido.areaId, 'No existe el área {id}.');
  if (!area.activo) throw conflicto('AREA_INACTIVA', `El área ${area.nombre} está dada de baja.`);

  const cantidades = new Map();
  for (const item of pedido.items) {
    cantidades.set(item.medicamentoId, (cantidades.get(item.medicamentoId) ?? 0) + item.cantidad);
  }
  const faltantes = [];
  for (const [medicamentoId, solicitado] of cantidades) {
    const medicamento = exigir(
      buscar(medicamentos, medicamentoId),
      medicamentoId,
      'No existe el medicamento {id}.',
    );
    if (!medicamento.activo) {
      throw conflicto('MEDICAMENTO_INACTIVO', `${nombreMedicamento(medicamento)} está dado de baja.`);
    }
    const disponible = stockTotal(medicamento);
    if (disponible < solicitado) {
      faltantes.push({ medicamentoId, medicamento: nombreMedicamento(medicamento), disponible, solicitado });
    }
  }
  if (faltantes.length) {
    const detalle = faltantes
      .map(
        (f) =>
          `Stock insuficiente de ${f.medicamento}: disponible ${f.disponible}, solicitado ${f.solicitado}.`,
      )
      .join(' ');
    throw conflicto('STOCK_INSUFICIENTE', detalle, { faltantes });
  }

  const transferencia = {
    id: nuevoId(),
    fechaHora,
    areaId: area.id,
    usuarioId: usuario.id,
    observaciones: texto(pedido.observaciones) || null,
    detalle: [],
  };
  for (const [medicamentoId, solicitado] of cantidades) {
    let restante = solicitado;
    for (const lote of lotesDisponibles(medicamentoId).sort(ordenFefo)) {
      if (restante === 0) break;
      const cantidad = Math.min(restante, lote.cantidadActual);
      lote.cantidadActual -= cantidad;
      restante -= cantidad;
      transferencia.detalle.push({ loteId: lote.id, cantidad });
      registrarMovimiento(lote, 'EGRESO', -cantidad, usuario, {
        fechaHora,
        transferenciaId: transferencia.id,
      });
    }
  }
  transferencias.push(transferencia);
  return transferencia;
}

// ---------- Rutas ----------

const rutas = [];
const ruta = (metodo, patron, permiso, manejador) =>
  rutas.push({ metodo, patron: new RegExp(`^${patron.replace(/\{id\}/g, '(\\d+)')}$`), permiso, manejador });

ruta('POST', '/api/auth/login', null, ({ cuerpo }) => {
  const usuario = usuarios.find((u) => u.username === texto(cuerpo.username).toLowerCase());
  if (!usuario || !usuario.activo || usuario.password !== cuerpo.password) {
    throw new Problema(401, 'NO_AUTENTICADO', 'Usuario o contraseña incorrectos.');
  }
  const token = randomUUID();
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS).toISOString();
  sesiones.set(token, { usuarioId: usuario.id, expiraEn });
  return { status: 200, cuerpo: { token, expiraEn, usuario: aSesion(usuario) } };
});

// Recuperación de contraseña simulada: la respuesta trae el código, como el perfil demo del backend.
const recuperaciones = new Map();
const MENSAJE_RECUPERACION =
  'Si el usuario existe y está activo, le enviamos un código para crear una contraseña nueva.';

ruta('POST', '/api/auth/recuperacion', null, ({ cuerpo }) => {
  validar([['username', texto(cuerpo.username).trim() ? null : 'Ingresá tu usuario.']]);
  const usuario = usuarios.find((u) => u.username === texto(cuerpo.username).trim().toLowerCase());
  if (!usuario?.activo)
    return { status: 202, cuerpo: { mensaje: MENSAJE_RECUPERACION, codigoSimulado: null } };
  const codigo = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  recuperaciones.set(usuario.id, { codigo, intentos: 0, venceEn: Date.now() + 15 * 60_000 });
  return { status: 202, cuerpo: { mensaje: MENSAJE_RECUPERACION, codigoSimulado: codigo } };
});

ruta('POST', '/api/auth/recuperacion/confirmar', null, ({ cuerpo }) => {
  validar([
    ['username', texto(cuerpo.username).trim() ? null : 'Ingresá tu usuario.'],
    ['codigo', /^\d{6}$/.test(texto(cuerpo.codigo)) ? null : 'El código tiene 6 números.'],
    [
      'passwordNueva',
      texto(cuerpo.passwordNueva).length < 8 ? 'La contraseña debe tener entre 8 y 72 caracteres.' : null,
    ],
  ]);
  const invalido = 'El código no es válido o ya venció. Pedí uno nuevo.';
  const usuario = usuarios.find((u) => u.username === texto(cuerpo.username).trim().toLowerCase());
  const pedido = usuario?.activo ? recuperaciones.get(usuario.id) : undefined;
  if (!pedido || pedido.venceEn < Date.now()) throw validacion({ codigo: invalido });
  pedido.intentos += 1;
  if (pedido.intentos > 5) {
    recuperaciones.delete(usuario.id);
    throw validacion({ codigo: 'Superaste la cantidad de intentos. Pedí un código nuevo.' });
  }
  if (pedido.codigo !== cuerpo.codigo) throw validacion({ codigo: invalido });
  usuario.password = cuerpo.passwordNueva;
  recuperaciones.delete(usuario.id);
  return { status: 204 };
});

ruta('GET', '/api/auth/me', 'AUTENTICADO', ({ usuario }) => ({ cuerpo: aSesion(usuario) }));

ruta('PATCH', '/api/auth/me/password', 'AUTENTICADO', ({ usuario, cuerpo }) => {
  if (cuerpo.passwordActual !== usuario.password) {
    throw validacion({ passwordActual: 'La contraseña actual no es correcta.' });
  }
  validar([
    [
      'passwordNueva',
      texto(cuerpo.passwordNueva).length < 8 ? 'Tiene que tener al menos 8 caracteres.' : null,
    ],
  ]);
  usuario.password = cuerpo.passwordNueva;
  return { status: 204 };
});

// Usuarios
ruta('GET', '/api/usuarios', 'USUARIO_GESTIONAR', ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const lista = filtroActivo(usuarios, url).filter((u) => contiene(`${u.username} ${u.nombreCompleto}`, q));
  return {
    cuerpo: paginar(
      lista.map(aUsuario),
      url,
      { username: (u) => u.username, nombreCompleto: (u) => u.nombreCompleto, creadoEn: (u) => u.creadoEn },
      'username,asc',
    ),
  };
});
ruta('POST', '/api/usuarios', 'USUARIO_GESTIONAR', ({ cuerpo }) => {
  validar([
    ['username', obligatorio(cuerpo.username)],
    ['nombreCompleto', obligatorio(cuerpo.nombreCompleto)],
    ['rol', PERMISOS[cuerpo.rol] ? null : 'Elegí un rol.'],
    ['password', texto(cuerpo.password).length < 8 ? 'Tiene que tener al menos 8 caracteres.' : null],
  ]);
  const username = texto(cuerpo.username).toLowerCase();
  if (usuarios.some((u) => u.username === username)) {
    throw conflicto('USERNAME_DUPLICADO', `Ya existe el usuario ${username}.`);
  }
  const nuevo = {
    id: nuevoId(),
    username,
    nombreCompleto: texto(cuerpo.nombreCompleto),
    rol: cuerpo.rol,
    password: cuerpo.password,
    activo: true,
    creadoEn: ahora(),
  };
  usuarios.push(nuevo);
  return { status: 201, cuerpo: aUsuario(nuevo) };
});
ruta('PUT', '/api/usuarios/{id}', 'USUARIO_GESTIONAR', ({ id, cuerpo }) => {
  const usuario = exigir(buscar(usuarios, id), id, 'No existe el usuario {id}.');
  validar([
    ['nombreCompleto', obligatorio(cuerpo.nombreCompleto)],
    ['rol', PERMISOS[cuerpo.rol] ? null : 'Elegí un rol.'],
  ]);
  const adminsActivos = usuarios.filter((u) => u.rol === 'ADMIN' && u.activo);
  if (usuario.rol === 'ADMIN' && cuerpo.rol !== 'ADMIN' && adminsActivos.length === 1) {
    throw conflicto('ULTIMO_ADMIN', 'No se le puede quitar el rol al último administrador activo.');
  }
  Object.assign(usuario, { nombreCompleto: texto(cuerpo.nombreCompleto), rol: cuerpo.rol });
  return { cuerpo: aUsuario(usuario) };
});
ruta('PATCH', '/api/usuarios/{id}/estado', 'USUARIO_GESTIONAR', ({ id, cuerpo, usuario: actual }) => {
  const usuario = exigir(buscar(usuarios, id), id, 'No existe el usuario {id}.');
  if (usuario.id === actual.id && !cuerpo.activo) {
    throw conflicto('ULTIMO_ADMIN', 'No podés desactivar tu propio usuario.');
  }
  usuario.activo = Boolean(cuerpo.activo);
  return { status: 204 };
});
ruta('PATCH', '/api/usuarios/{id}/password', 'USUARIO_GESTIONAR', ({ id, cuerpo }) => {
  const usuario = exigir(buscar(usuarios, id), id, 'No existe el usuario {id}.');
  validar([
    [
      'passwordNueva',
      texto(cuerpo.passwordNueva).length < 8 ? 'Tiene que tener al menos 8 caracteres.' : null,
    ],
  ]);
  usuario.password = cuerpo.passwordNueva;
  return { status: 204 };
});

// Proveedores
function validarProveedor(cuerpo, idActual) {
  const cuit = texto(cuerpo.cuit).replaceAll('-', '');
  validar([
    ['razonSocial', obligatorio(cuerpo.razonSocial)],
    [
      'cuit',
      /^\d{11}$/.test(cuit) && cuitValido(cuit.slice(0, 10)) === cuit ? null : 'El CUIT no es válido.',
    ],
  ]);
  if (proveedores.some((p) => p.cuit === cuit && p.id !== idActual)) {
    throw conflicto('CUIT_DUPLICADO', `Ya existe un proveedor con el CUIT ${cuerpo.cuit}.`);
  }
  return {
    razonSocial: texto(cuerpo.razonSocial),
    cuit,
    telefono: texto(cuerpo.telefono) || null,
    email: texto(cuerpo.email) || null,
  };
}
ruta('GET', '/api/proveedores', 'LECTURA', ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const lista = filtroActivo(proveedores, url).filter((p) => contiene(`${p.razonSocial} ${p.cuit}`, q));
  return {
    cuerpo: paginar(lista.map(aProveedor), url, { razonSocial: (p) => p.razonSocial }, 'razonSocial,asc'),
  };
});
ruta('GET', '/api/proveedores/{id}', 'LECTURA', ({ id }) => ({
  cuerpo: aProveedor(exigir(buscar(proveedores, id), id, 'No existe el proveedor {id}.')),
}));
ruta('POST', '/api/proveedores', 'CATALOGO_EDITAR', ({ cuerpo }) => {
  const nuevo = { id: nuevoId(), ...validarProveedor(cuerpo), activo: true };
  proveedores.push(nuevo);
  return { status: 201, cuerpo: aProveedor(nuevo) };
});
ruta('PUT', '/api/proveedores/{id}', 'CATALOGO_EDITAR', ({ id, cuerpo }) => {
  const proveedor = exigir(buscar(proveedores, id), id, 'No existe el proveedor {id}.');
  Object.assign(proveedor, validarProveedor(cuerpo, proveedor.id));
  return { cuerpo: aProveedor(proveedor) };
});
ruta('PATCH', '/api/proveedores/{id}/estado', 'CATALOGO_EDITAR', ({ id, cuerpo }) => {
  exigir(buscar(proveedores, id), id, 'No existe el proveedor {id}.').activo = Boolean(cuerpo.activo);
  return { status: 204 };
});

// Áreas
function validarArea(cuerpo, idActual) {
  validar([['nombre', obligatorio(cuerpo.nombre)]]);
  const nombre = texto(cuerpo.nombre);
  if (areas.some((a) => a.nombre.toLowerCase() === nombre.toLowerCase() && a.id !== idActual)) {
    throw conflicto('NOMBRE_DUPLICADO', `Ya existe el área ${nombre}.`);
  }
  return nombre;
}
ruta('GET', '/api/areas', 'LECTURA', ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const lista = filtroActivo(areas, url).filter((a) => contiene(a.nombre, q));
  return { cuerpo: paginar(lista, url, { nombre: (a) => a.nombre }, 'nombre,asc') };
});
ruta('POST', '/api/areas', 'CATALOGO_EDITAR', ({ cuerpo }) => {
  const nueva = { id: nuevoId(), nombre: validarArea(cuerpo), activo: true };
  areas.push(nueva);
  return { status: 201, cuerpo: nueva };
});
ruta('PUT', '/api/areas/{id}', 'CATALOGO_EDITAR', ({ id, cuerpo }) => {
  const area = exigir(buscar(areas, id), id, 'No existe el área {id}.');
  area.nombre = validarArea(cuerpo, area.id);
  return { cuerpo: area };
});
ruta('PATCH', '/api/areas/{id}/estado', 'CATALOGO_EDITAR', ({ id, cuerpo }) => {
  exigir(buscar(areas, id), id, 'No existe el área {id}.').activo = Boolean(cuerpo.activo);
  return { status: 204 };
});

// Medicamentos
function validarMedicamento(cuerpo, idActual) {
  validar([
    ['codigo', obligatorio(cuerpo.codigo)],
    ['nombre', obligatorio(cuerpo.nombre)],
    ['presentacion', obligatorio(cuerpo.presentacion)],
    [
      'stockMinimo',
      Number.isInteger(cuerpo.stockMinimo) && cuerpo.stockMinimo >= 0 ? null : 'Tiene que ser 0 o más.',
    ],
  ]);
  const codigo = texto(cuerpo.codigo).toUpperCase();
  if (medicamentos.some((m) => m.codigo === codigo && m.id !== idActual)) {
    throw conflicto('CODIGO_DUPLICADO', `Ya existe un medicamento con el código ${codigo}.`);
  }
  return {
    codigo,
    nombre: texto(cuerpo.nombre),
    presentacion: texto(cuerpo.presentacion),
    stockMinimo: cuerpo.stockMinimo,
  };
}
ruta('GET', '/api/medicamentos', 'LECTURA', ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const estado = url.searchParams.get('estado');
  const lista = filtroActivo(medicamentos, url)
    .filter((m) => contiene(`${m.codigo} ${m.nombre}`, q))
    .map(aMedicamento)
    .filter((m) => !estado || m.estadoStock === estado);
  return {
    cuerpo: paginar(
      lista,
      url,
      {
        codigo: (m) => m.codigo,
        nombre: (m) => m.nombre,
        stockTotal: (m) => m.stockTotal,
        proximoVencimiento: (m) => m.proximoVencimiento,
      },
      'nombre,asc',
    ),
  };
});
ruta('GET', '/api/medicamentos/{id}', 'LECTURA', ({ id }) => {
  const medicamento = exigir(buscar(medicamentos, id), id, 'No existe el medicamento {id}.');
  const conStock = lotes
    .filter((l) => l.medicamentoId === medicamento.id && l.cantidadActual > 0)
    .sort(ordenFefo);
  return { cuerpo: { ...aMedicamento(medicamento), lotes: conStock.map(aLote) } };
});
ruta('POST', '/api/medicamentos', 'CATALOGO_EDITAR', ({ cuerpo }) => {
  const nuevo = { id: nuevoId(), ...validarMedicamento(cuerpo), activo: true };
  medicamentos.push(nuevo);
  return { status: 201, cuerpo: aMedicamento(nuevo) };
});
ruta('PUT', '/api/medicamentos/{id}', 'CATALOGO_EDITAR', ({ id, cuerpo }) => {
  const medicamento = exigir(buscar(medicamentos, id), id, 'No existe el medicamento {id}.');
  Object.assign(medicamento, validarMedicamento(cuerpo, medicamento.id));
  return { cuerpo: aMedicamento(medicamento) };
});
ruta('PATCH', '/api/medicamentos/{id}/estado', 'CATALOGO_EDITAR', ({ id, cuerpo }) => {
  const medicamento = exigir(buscar(medicamentos, id), id, 'No existe el medicamento {id}.');
  const stock = stockTotal(medicamento);
  if (!cuerpo.activo && stock > 0) {
    throw conflicto(
      'MEDICAMENTO_CON_STOCK',
      `No se puede dar de baja ${nombreMedicamento(medicamento)}: tiene ${stock} unidades en stock.`,
    );
  }
  medicamento.activo = Boolean(cuerpo.activo);
  return { status: 204 };
});
ruta('POST', '/api/medicamentos/{id}/lotes', 'STOCK_INGRESAR', ({ id, cuerpo, usuario }) => {
  const medicamento = exigir(buscar(medicamentos, id), id, 'No existe el medicamento {id}.');
  validar([
    ['proveedorId', Number.isInteger(cuerpo.proveedorId) ? null : 'Elegí un proveedor.'],
    ['numeroLote', obligatorio(cuerpo.numeroLote)],
    [
      'fechaVencimiento',
      typeof cuerpo.fechaVencimiento !== 'string'
        ? 'Es obligatoria.'
        : cuerpo.fechaVencimiento < hoy()
          ? 'La fecha de vencimiento no puede ser anterior a hoy.'
          : null,
    ],
    ['cantidad', enteroPositivo(cuerpo.cantidad)],
  ]);
  if (!medicamento.activo)
    throw conflicto('MEDICAMENTO_INACTIVO', `${nombreMedicamento(medicamento)} está dado de baja.`);
  const proveedor = exigir(
    buscar(proveedores, cuerpo.proveedorId),
    cuerpo.proveedorId,
    'No existe el proveedor {id}.',
  );
  if (!proveedor.activo)
    throw conflicto('PROVEEDOR_INACTIVO', `El proveedor ${proveedor.razonSocial} está dado de baja.`);
  const numeroLote = texto(cuerpo.numeroLote).toUpperCase();
  if (lotes.some((l) => l.medicamentoId === medicamento.id && l.numeroLote === numeroLote)) {
    throw conflicto(
      'LOTE_DUPLICADO',
      `El lote ${numeroLote} ya está registrado para ${nombreMedicamento(medicamento)}.`,
    );
  }
  const lote = crearLote({
    medicamento,
    proveedor,
    numeroLote,
    fechaVencimiento: cuerpo.fechaVencimiento,
    cantidad: cuerpo.cantidad,
    usuario,
    fechaIngreso: hoy(),
  });
  return { status: 201, cuerpo: { lote: aLote(lote), stockTotalResultante: stockTotal(medicamento) } };
});

// Lotes y movimientos
ruta('GET', '/api/lotes', 'LECTURA', ({ url }) => {
  const medicamentoId = url.searchParams.get('medicamentoId');
  const estados = url.searchParams.getAll('estado');
  const lista = lotes
    .filter((l) => !medicamentoId || l.medicamentoId === Number(medicamentoId))
    .map(aLote)
    .filter((l) => estados.length === 0 || estados.includes(l.estado));
  return {
    cuerpo: paginar(
      lista,
      url,
      { fechaVencimiento: (l) => l.fechaVencimiento, fechaIngreso: (l) => l.fechaIngreso },
      'fechaVencimiento,asc',
    ),
  };
});
ruta('POST', '/api/lotes/{id}/baja', 'STOCK_BAJA_AJUSTE', ({ id, cuerpo, usuario }) => {
  const lote = exigir(buscar(lotes, id), id, 'No existe el lote {id}.');
  validar([['motivo', obligatorio(cuerpo.motivo)]]);
  if (!vencido(lote)) throw conflicto('LOTE_NO_VENCIDO', `El lote ${lote.numeroLote} todavía no venció.`);
  if (lote.cantidadActual === 0)
    throw conflicto('LOTE_SIN_STOCK', `El lote ${lote.numeroLote} ya no tiene stock.`);
  const cantidad = lote.cantidadActual;
  lote.cantidadActual = 0;
  registrarMovimiento(lote, 'BAJA_VENCIMIENTO', -cantidad, usuario, { motivo: texto(cuerpo.motivo) });
  return { cuerpo: aLote(lote) };
});
ruta('POST', '/api/lotes/{id}/ajuste', 'STOCK_BAJA_AJUSTE', ({ id, cuerpo, usuario }) => {
  const lote = exigir(buscar(lotes, id), id, 'No existe el lote {id}.');
  const motivo = texto(cuerpo.motivo);
  validar([
    [
      'cantidadNueva',
      !Number.isInteger(cuerpo.cantidadNueva) ||
      cuerpo.cantidadNueva < 0 ||
      cuerpo.cantidadNueva > lote.cantidadInicial
        ? `Tiene que estar entre 0 y ${lote.cantidadInicial}.`
        : cuerpo.cantidadNueva === lote.cantidadActual
          ? 'Tiene que ser distinta de la cantidad actual.'
          : null,
    ],
    ['motivo', motivo.length < 5 || motivo.length > 200 ? 'Tiene que tener entre 5 y 200 caracteres.' : null],
  ]);
  const diferencia = cuerpo.cantidadNueva - lote.cantidadActual;
  lote.cantidadActual = cuerpo.cantidadNueva;
  registrarMovimiento(lote, 'AJUSTE', diferencia, usuario, { motivo });
  return { cuerpo: aLote(lote) };
});
ruta('GET', '/api/movimientos', 'LECTURA', ({ url }) => {
  const medicamentoId = url.searchParams.get('medicamentoId');
  const loteId = url.searchParams.get('loteId');
  const tipo = url.searchParams.get('tipo');
  const lista = movimientos
    .filter((m) => !loteId || m.loteId === Number(loteId))
    .filter((m) => !medicamentoId || buscar(lotes, m.loteId).medicamentoId === Number(medicamentoId))
    .filter((m) => !tipo || m.tipo === tipo)
    .map(aMovimiento);
  return { cuerpo: paginar(lista, url, { fechaHora: (m) => m.fechaHora }, 'fechaHora,desc') };
});

// Transferencias
function filtrarTransferencias(url) {
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');
  const areaId = url.searchParams.get('areaId');
  const diaLocal = (instante) => formatoDia.format(new Date(instante));
  return transferencias.filter(
    (t) =>
      (!desde || diaLocal(t.fechaHora) >= desde) &&
      (!hasta || diaLocal(t.fechaHora) <= hasta) &&
      (!areaId || t.areaId === Number(areaId)),
  );
}
ruta('GET', '/api/transferencias', 'LECTURA', ({ url }) => ({
  cuerpo: paginar(
    filtrarTransferencias(url).map(aResumenTransferencia),
    url,
    { fechaHora: (t) => t.fechaHora },
    'fechaHora,desc',
  ),
}));
ruta('GET', '/api/transferencias/{id}', 'LECTURA', ({ id }) => ({
  cuerpo: aTransferencia(exigir(buscar(transferencias, id), id, 'No existe la transferencia {id}.')),
}));
ruta('POST', '/api/transferencias', 'TRANSFERENCIA_CREAR', ({ cuerpo, usuario }) => ({
  status: 201,
  cuerpo: aTransferencia(transferir(cuerpo, usuario)),
}));
ruta('GET', '/api/transferencias/exportar', 'LECTURA', ({ url }) => {
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');
  if (!desde || !hasta) throw new Problema(400, 'PARAMETRO_INVALIDO', 'Indicá las fechas desde y hasta.');
  if (diasEntre(desde, hasta) > 366)
    throw new Problema(400, 'PARAMETRO_INVALIDO', 'El rango no puede superar 366 días.');
  const celda = (valor) => {
    let v = String(valor ?? '');
    if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
    return /[;"\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
  };
  const fechaHora = (instante) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date(instante))
        .map((parte) => [parte.type, parte.value]),
    );
    return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
  };
  const filas = [
    [
      'Número',
      'Fecha y hora',
      'Área',
      'Realizada por',
      'Código',
      'Medicamento',
      'Lote',
      'Vencimiento',
      'Cantidad',
      'Observaciones',
    ],
  ];
  for (const t of filtrarTransferencias(url)) {
    const completa = aTransferencia(t);
    for (const d of completa.detalle) {
      filas.push([
        completa.numero,
        fechaHora(completa.fechaHora),
        completa.area.nombre,
        completa.realizadaPor.nombreCompleto,
        buscar(medicamentos, d.medicamentoId).codigo,
        d.medicamento,
        d.numeroLote,
        d.fechaVencimiento.split('-').reverse().join('/'),
        d.cantidad,
        completa.observaciones,
      ]);
    }
  }
  const filtros = [`Desde: ${fechaCorta(desde)}`, `Hasta: ${fechaCorta(hasta)}`];
  const areaId = url.searchParams.get('areaId');
  if (areaId) filtros.push(`Área: ${buscar(areas, Number(areaId))?.nombre ?? areaId}`);
  return archivoReporte(url, `transferencias_${desde}_${hasta}`, 'Transferencias a áreas', filas, {
    celda,
    numericas: [8],
    filtros,
  });
});

ruta('GET', '/api/transferencias/{id}/pdf', 'LECTURA', ({ id }) => {
  const t = aTransferencia(exigir(buscar(transferencias, id), id, 'No existe la transferencia {id}.'));
  const filas = [
    ['Medicamento', 'Lote', 'Vencimiento', 'Cantidad'],
    ...t.detalle.map((d) => [d.medicamento, d.numeroLote, fechaCorta(d.fechaVencimiento), d.cantidad]),
  ];
  const subtitulo = `Área de destino: ${t.area.nombre}  ·  Entregó: ${t.realizadaPor.nombreCompleto}`;
  return {
    archivo: pdfTabla(`Comprobante de transferencia ${t.numero}`, subtitulo, filas, [3]),
    tipo: 'application/pdf',
    nombre: `transferencia_${t.numero}.pdf`,
  };
});

// Alertas y resumen
function calcularAlertas() {
  const activos = medicamentos.filter((m) => m.activo).map(aMedicamento);
  const aAlertaMedicamento = (m) => ({
    medicamentoId: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    presentacion: m.presentacion,
    stockTotal: m.stockTotal,
    stockMinimo: m.stockMinimo,
  });
  const aAlertaLote = (l) => {
    const r = aLote(l);
    return {
      loteId: r.id,
      numeroLote: r.numeroLote,
      medicamentoId: r.medicamentoId,
      medicamento: r.medicamento,
      fechaVencimiento: r.fechaVencimiento,
      diasParaVencer: r.diasParaVencer,
      cantidadActual: r.cantidadActual,
    };
  };
  const conStock = lotes.filter((l) => l.cantidadActual > 0).sort(ordenFefo);
  return {
    diasPorVencer: DIAS_POR_VENCER,
    sinStock: activos
      .filter((m) => m.estadoStock === 'SIN_STOCK')
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(aAlertaMedicamento),
    stockBajo: activos
      .filter((m) => m.estadoStock === 'STOCK_BAJO')
      .sort((a, b) => a.stockTotal / a.stockMinimo - b.stockTotal / b.stockMinimo)
      .map(aAlertaMedicamento),
    vencidos: conStock.filter((l) => estadoLote(l) === 'VENCIDO').map(aAlertaLote),
    porVencer: conStock.filter((l) => estadoLote(l) === 'POR_VENCER').map(aAlertaLote),
  };
}
ruta('GET', '/api/alertas', 'LECTURA', () => ({ cuerpo: calcularAlertas() }));
ruta('GET', '/api/resumen', 'LECTURA', () => {
  const alertas = calcularAlertas();
  const desde = sumarDias(hoy(), -30);
  const diaLocal = (instante) => formatoDia.format(new Date(instante));
  const unidadesPorArea = new Map();
  for (const t of transferencias.filter((t) => diaLocal(t.fechaHora) >= desde)) {
    const unidades = t.detalle.reduce((s, d) => s + d.cantidad, 0);
    unidadesPorArea.set(t.areaId, (unidadesPorArea.get(t.areaId) ?? 0) + unidades);
  }
  return {
    cuerpo: {
      totales: {
        sinStock: alertas.sinStock.length,
        stockBajo: alertas.stockBajo.length,
        vencidos: alertas.vencidos.length,
        porVencer: alertas.porVencer.length,
      },
      diasPorVencer: DIAS_POR_VENCER,
      medicamentosActivos: medicamentos.filter((m) => m.activo).length,
      transferenciasHoy: transferencias.filter((t) => diaLocal(t.fechaHora) === hoy()).length,
      ultimasTransferencias: [...transferencias]
        .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
        .slice(0, 5)
        .map(aResumenTransferencia),
      egresosPorArea: [...unidadesPorArea]
        .map(([areaId, unidades]) => ({ areaId, area: buscar(areas, areaId).nombre, unidades }))
        .sort((a, b) => b.unidades - a.unidades),
    },
  };
});

// ---------- Reportes ----------

const celdaCsv = (valor) => {
  let v = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[;"\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
};

/** filas[0] son los encabezados. Mismos formatos que el backend: CSV, XLSX y PDF. */
function archivoReporte(
  url,
  nombreBase,
  titulo,
  filas,
  { celda = celdaCsv, numericas = [], filtros = [] } = {},
) {
  const formato = url.searchParams.get('formato') ?? 'CSV';
  const subtitulo = [...filtros, `Generado el ${new Date().toLocaleString('es-AR')}`].join('  ·  ');
  if (formato === 'PDF') {
    return {
      archivo: pdfTabla(titulo, subtitulo, filas, numericas),
      tipo: 'application/pdf',
      nombre: `${nombreBase}.pdf`,
    };
  }
  if (formato === 'XLSX') {
    return {
      archivo: xlsx(titulo, subtitulo, filas, numericas),
      tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      nombre: `${nombreBase}.xlsx`,
    };
  }
  if (formato !== 'CSV') {
    throw new Problema(400, 'PARAMETRO_INVALIDO', "El parámetro 'formato' tiene un valor inválido.");
  }
  return {
    archivo: `\ufeff${filas.map((f) => f.map(celda).join(';')).join('\r\n')}\r\n`,
    tipo: 'text/csv; charset=UTF-8',
    nombre: `${nombreBase}.csv`,
  };
}

const fechaCorta = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const TEXTO_ESTADO_STOCK = { SIN_STOCK: 'Sin stock', STOCK_BAJO: 'Stock bajo', OK: 'OK' };
const TEXTO_ESTADO_LOTE = {
  VIGENTE: 'Vigente',
  POR_VENCER: 'Por vencer',
  VENCIDO: 'Vencido',
  AGOTADO: 'Agotado',
};

ruta('GET', '/api/medicamentos/exportar', 'LECTURA', ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const estado = url.searchParams.get('estado');
  const activo = url.searchParams.get('activo');
  const lista = medicamentos
    .map(aMedicamento)
    .filter((m) => !q || m.codigo.toLowerCase().includes(q) || m.nombre.toLowerCase().includes(q))
    .filter((m) => !estado || m.estadoStock === estado)
    .filter((m) => activo === null || String(m.activo) === activo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const filas = [
    [
      'Código',
      'Nombre',
      'Presentación',
      'Stock total',
      'Stock mínimo',
      'Próximo vencimiento',
      'Estado',
      'Activo',
    ],
    ...lista.map((m) => [
      m.codigo,
      m.nombre,
      m.presentacion,
      m.stockTotal,
      m.stockMinimo,
      fechaCorta(m.proximoVencimiento),
      TEXTO_ESTADO_STOCK[m.estadoStock],
      m.activo ? 'Sí' : 'No',
    ]),
  ];
  const filtros = [];
  if (q) filtros.push(`Búsqueda: ${q}`);
  if (estado) filtros.push(`Estado: ${TEXTO_ESTADO_STOCK[estado]}`);
  filtros.push(activo === null ? 'Incluye inactivos' : 'Solo activos');
  return archivoReporte(url, 'stock_medicamentos', 'Stock de medicamentos', filas, {
    numericas: [3, 4],
    filtros,
  });
});

ruta('GET', '/api/lotes/exportar', 'LECTURA', ({ url }) => {
  const estados = url.searchParams.getAll('estado');
  const medicamentoId = url.searchParams.get('medicamentoId');
  const lista = lotes
    .map(aLote)
    .filter((l) => estados.length === 0 || estados.includes(l.estado))
    .filter((l) => !medicamentoId || String(l.medicamentoId) === medicamentoId)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
  const filas = [
    [
      'Medicamento',
      'Lote',
      'Proveedor',
      'Vencimiento',
      'Días',
      'Cantidad actual',
      'Cantidad inicial',
      'Ingreso',
      'Estado',
    ],
    ...lista.map((l) => [
      l.medicamento,
      l.numeroLote,
      l.proveedor,
      fechaCorta(l.fechaVencimiento),
      l.diasParaVencer,
      l.cantidadActual,
      l.cantidadInicial,
      fechaCorta(l.fechaIngreso),
      TEXTO_ESTADO_LOTE[l.estado],
    ]),
  ];
  const filtros = [
    `Estado: ${estados.length ? estados.map((e) => TEXTO_ESTADO_LOTE[e]).join(', ') : 'todos'}`,
  ];
  return archivoReporte(url, 'lotes_vencimientos', 'Lotes y vencimientos', filas, {
    numericas: [4, 5, 6],
    filtros,
  });
});

// ---------- Servidor ----------

const sesiones = new Map();

function autenticar(peticion) {
  const [tipo, token] = (peticion.headers.authorization ?? '').split(' ');
  const sesion = tipo === 'Bearer' ? sesiones.get(token) : undefined;
  if (!sesion || Date.parse(sesion.expiraEn) < Date.now()) return null;
  const usuario = buscar(usuarios, sesion.usuarioId);
  return usuario?.activo ? usuario : null;
}

async function leerCuerpo(peticion) {
  let texto = '';
  for await (const parte of peticion) texto += parte;
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch {
    throw new Problema(400, 'CUERPO_INVALIDO', 'El cuerpo del pedido no es un JSON válido.');
  }
}

function responder(respuesta, status, cuerpo, tipo = 'application/json') {
  respuesta.writeHead(status, cuerpo === undefined ? {} : { 'Content-Type': tipo });
  respuesta.end(cuerpo === undefined ? undefined : JSON.stringify(cuerpo));
}

cargarDatosDemo();

createServer(async (peticion, respuesta) => {
  await new Promise((r) => setTimeout(r, DEMORA_MS));
  const url = new URL(peticion.url, `http://localhost:${PUERTO}`);
  try {
    const encontrada = rutas.find((r) => r.metodo === peticion.method && r.patron.test(url.pathname));
    if (!encontrada) throw noEncontrado(`No existe la ruta ${peticion.method} ${url.pathname}.`);
    let usuario = null;
    if (encontrada.permiso) {
      usuario = autenticar(peticion);
      if (!usuario) throw new Problema(401, 'NO_AUTENTICADO', 'Iniciá sesión para continuar.');
      if (encontrada.permiso !== 'AUTENTICADO' && !PERMISOS[usuario.rol].includes(encontrada.permiso)) {
        throw new Problema(403, 'SIN_PERMISO', 'No tenés permiso para esta acción.');
      }
    }
    const [, id] = encontrada.patron.exec(url.pathname);
    const cuerpo = ['POST', 'PUT', 'PATCH'].includes(peticion.method) ? await leerCuerpo(peticion) : {};
    const resultado = encontrada.manejador({ url, id, cuerpo, usuario });
    if (resultado.archivo !== undefined) {
      respuesta.writeHead(200, {
        'Content-Type': resultado.tipo,
        'Content-Disposition': `attachment; filename="${resultado.nombre}"`,
      });
      respuesta.end(resultado.archivo);
      return;
    }
    responder(respuesta, resultado.status ?? 200, resultado.cuerpo);
  } catch (error) {
    if (error instanceof Problema) {
      const extra = error.cuerpo.status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {};
      respuesta.writeHead(error.cuerpo.status, { 'Content-Type': 'application/problem+json', ...extra });
      respuesta.end(JSON.stringify(error.cuerpo));
      return;
    }
    const errorId = randomUUID();
    process.stderr.write(`[mock] error ${errorId}: ${error.stack}\n`);
    responder(
      respuesta,
      500,
      {
        title: 'Error interno',
        status: 500,
        detail: 'Ocurrió un error inesperado.',
        codigo: 'ERROR_INTERNO',
        errorId,
      },
      'application/problem+json',
    );
  }
}).listen(PUERTO, () => {
  process.stdout.write(
    `Backend simulado en http://localhost:${PUERTO} — usuarios admin, farmaceutico y consulta (contraseña ${PASSWORD_DEMO})\n`,
  );
});
