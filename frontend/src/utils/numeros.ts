const formatoEntero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** 1250 → "1.250". */
export function formatearNumero(valor: number): string {
  return formatoEntero.format(valor);
}

/** Variación de stock con signo: 120 → "+120"; -30 → "−30". */
export function formatearVariacion(valor: number): string {
  if (valor > 0) return `+${formatoEntero.format(valor)}`;
  if (valor < 0) return `−${formatoEntero.format(-valor)}`;
  return '0';
}
