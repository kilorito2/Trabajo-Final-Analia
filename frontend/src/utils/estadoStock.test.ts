import { describe, expect, it } from 'vitest';
import { describirEstadoLote, describirEstadoStock } from './estadoStock';

describe('estado de stock', () => {
  it.each([
    ['SIN_STOCK', 'Sin stock', 'peligro'],
    ['STOCK_BAJO', 'Stock bajo', 'aviso'],
    ['OK', 'OK', 'ok'],
  ] as const)('%s → "%s" con tono %s', (estado, texto, tono) => {
    expect(describirEstadoStock(estado)).toEqual({ texto, tono });
  });

  it.each([
    ['VENCIDO', 'Vencido', 'peligro'],
    ['POR_VENCER', 'Por vencer', 'aviso'],
    ['VIGENTE', 'Vigente', 'ok'],
    ['AGOTADO', 'Agotado', 'neutro'],
  ] as const)('lote %s → "%s" con tono %s', (estado, texto, tono) => {
    expect(describirEstadoLote(estado)).toEqual({ texto, tono });
  });
});
