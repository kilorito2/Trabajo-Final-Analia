import type { EstadoLote, EstadoStock } from '../api/tipos';

export type Tono = 'peligro' | 'aviso' | 'ok' | 'neutro';

type Descripcion = { texto: string; tono: Tono };

// `satisfies Record<…>` obliga a cubrir exactamente los valores del enum del backend:
// si agrega o cambia un estado, el build falla en vez de mostrar una insignia vacía.
const ESTADOS_STOCK = {
  SIN_STOCK: { texto: 'Sin stock', tono: 'peligro' },
  STOCK_BAJO: { texto: 'Stock bajo', tono: 'aviso' },
  OK: { texto: 'OK', tono: 'ok' },
} as const satisfies Record<EstadoStock, Descripcion>;

const ESTADOS_LOTE = {
  VENCIDO: { texto: 'Vencido', tono: 'peligro' },
  POR_VENCER: { texto: 'Por vencer', tono: 'aviso' },
  VIGENTE: { texto: 'Vigente', tono: 'ok' },
  AGOTADO: { texto: 'Agotado', tono: 'neutro' },
} as const satisfies Record<EstadoLote, Descripcion>;

export function describirEstadoStock(estado: EstadoStock): Descripcion {
  return ESTADOS_STOCK[estado];
}

export function describirEstadoLote(estado: EstadoLote): Descripcion {
  return ESTADOS_LOTE[estado];
}
