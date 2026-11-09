// Los LocalDate del backend ("2026-11-30") se tratan como texto y nunca pasan por
// new Date("2026-11-30"): eso se interpreta como medianoche UTC y en Argentina
// mostraría el día anterior.

const ZONA = 'America/Argentina/Buenos_Aires';

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formatoHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const PATRON_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

function partesDia(fecha: string): [number, number, number] {
  const coincidencia = PATRON_DIA.exec(fecha);
  if (!coincidencia) {
    throw new Error(`Fecha inválida: ${fecha}`);
  }
  return [Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3])];
}

/** "2026-11-30" → "30/11/2026". */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const [anio, mes, dia] = partesDia(fecha);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
}

/** Hoy como "aaaa-mm-dd" en la hora de Argentina, la misma que usa el backend. */
export function hoy(): string {
  return formatoDia.format(new Date());
}

/** Suma (o resta) días a un "aaaa-mm-dd" sin pasar por la zona horaria del navegador. */
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = partesDia(fecha);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return resultado.toISOString().slice(0, 10);
}

/** Días desde `desde` hasta `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  const [a1, m1, d1] = partesDia(desde);
  const [a2, m2, d2] = partesDia(hasta);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

/** 12 → "Vence en 12 días"; -3 → "Venció hace 3 días". */
export function describirDiasParaVencer(dias: number): string {
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  if (dias > 1) return `Vence en ${dias} días`;
  if (dias === -1) return 'Venció ayer';
  return `Venció hace ${-dias} días`;
}

function partesInstante(formato: Intl.DateTimeFormat, instante: string): Record<string, string> {
  const partes: Record<string, string> = {};
  for (const parte of formato.formatToParts(new Date(instante))) {
    partes[parte.type] = parte.value;
  }
  return partes;
}

/** Instante ISO con zona → "09/11/2026 17:49" en hora de Argentina. */
export function formatearFechaHora(instante: string | null | undefined): string {
  if (!instante) return '—';
  const p = partesInstante(formatoFechaHora, instante);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

/** Instante ISO con zona → "22:15" en hora de Argentina. */
export function formatearHora(instante: string): string {
  const p = partesInstante(formatoHora, instante);
  return `${p.hour}:${p.minute}`;
}
