import { descargar, type Parametros, type TipoArchivo } from './cliente';
import type { EstadoLote, EstadoStock, FormatoReporte } from './tipos';

// Los reportes los arma el backend con todo lo filtrado, no solo la página visible.

const TIPO: Record<FormatoReporte, TipoArchivo> = {
  CSV: 'text/csv',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PDF: 'application/pdf',
};

function exportar(ruta: string, filtros: Parametros, formato: FormatoReporte) {
  return descargar(ruta, { ...filtros, formato }, TIPO[formato]);
}

export function exportarMedicamentos(
  filtros: { q?: string; estado?: EstadoStock; activo?: boolean },
  formato: FormatoReporte,
) {
  return exportar('/api/medicamentos/exportar', filtros, formato);
}

export function exportarLotes(
  filtros: { q?: string; medicamentoId?: number; estado?: EstadoLote[] },
  formato: FormatoReporte,
) {
  return exportar('/api/lotes/exportar', filtros, formato);
}

export function exportarTransferencias(
  filtros: { desde: string; hasta: string; areaId?: number },
  formato: FormatoReporte,
) {
  return exportar('/api/transferencias/exportar', filtros, formato);
}

export function exportarMovimientos(filtros: { medicamentoId?: number }, formato: FormatoReporte) {
  return exportar('/api/movimientos/exportar', filtros, formato);
}

type FiltrosListado = { q?: string; activo?: boolean };

export function exportarProveedores(filtros: FiltrosListado, formato: FormatoReporte) {
  return exportar('/api/proveedores/exportar', filtros, formato);
}

export function exportarAreas(filtros: FiltrosListado, formato: FormatoReporte) {
  return exportar('/api/areas/exportar', filtros, formato);
}

export function exportarUsuarios(filtros: FiltrosListado, formato: FormatoReporte) {
  return exportar('/api/usuarios/exportar', filtros, formato);
}

export function exportarAlertas(formato: FormatoReporte) {
  return exportar('/api/alertas/exportar', {}, formato);
}

export function descargarComprobante(id: number) {
  return descargar(`/api/transferencias/${id}/pdf`, undefined, 'application/pdf');
}
