export type Tono = 'peligro' | 'aviso' | 'ok' | 'neutro';

type Descripcion = { texto: string; tono: Tono };

// Valores de los enums del contrato (Back_v2 §8.3). Cuando exista src/api/esquema.ts,
// tipos.ts verifica en compilación que coincidan con los del OpenAPI.
const ESTADOS_STOCK = {
  SIN_STOCK: { texto: 'Sin stock', tono: 'peligro' },
  STOCK_BAJO: { texto: 'Stock bajo', tono: 'aviso' },
  OK: { texto: 'OK', tono: 'ok' },
} as const satisfies Record<string, Descripcion>;

const ESTADOS_LOTE = {
  VENCIDO: { texto: 'Vencido', tono: 'peligro' },
  POR_VENCER: { texto: 'Por vencer', tono: 'aviso' },
  VIGENTE: { texto: 'Vigente', tono: 'ok' },
  AGOTADO: { texto: 'Agotado', tono: 'neutro' },
} as const satisfies Record<string, Descripcion>;

export type EstadoStock = keyof typeof ESTADOS_STOCK;
export type EstadoLote = keyof typeof ESTADOS_LOTE;

export function describirEstadoStock(estado: EstadoStock): Descripcion {
  return ESTADOS_STOCK[estado];
}

export function describirEstadoLote(estado: EstadoLote): Descripcion {
  return ESTADOS_LOTE[estado];
}
