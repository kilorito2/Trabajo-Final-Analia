import { describe, expect, it } from 'vitest';
import { formatearNumero, formatearVariacion } from './numeros';

describe('números', () => {
  it('usa el separador de miles de es-AR', () => {
    expect(formatearNumero(1250)).toBe('1.250');
    expect(formatearNumero(0)).toBe('0');
  });

  it('muestra las variaciones con signo', () => {
    expect(formatearVariacion(1200)).toBe('+1.200');
    expect(formatearVariacion(-30)).toBe('−30');
    expect(formatearVariacion(0)).toBe('0');
  });
});
