import { describe, expect, it } from 'vitest';
import { aplicarMascaraCuit, esCuitValido } from './cuit';

// Mismos vectores que CuitValidatorTest del backend.
describe('CUIT', () => {
  it.each(['20-12345678-6', '30-71234567-1', '27-33333333-9', '20123456786'])('%s es válido', (cuit) => {
    expect(esCuitValido(cuit)).toBe(true);
  });

  it.each([
    ['20-12345678-5', 'dígito verificador incorrecto'],
    ['20-99999999-0', 'esa base no tiene dígito verificador válido'],
    ['2012345678', '10 dígitos'],
    ['20-1234567A-6', 'no numérico'],
  ])('%s es inválido (%s)', (cuit) => {
    expect(esCuitValido(cuit)).toBe(false);
  });

  it('aplica la máscara mientras se escribe', () => {
    expect(aplicarMascaraCuit('2')).toBe('2');
    expect(aplicarMascaraCuit('20')).toBe('20');
    expect(aplicarMascaraCuit('201')).toBe('20-1');
    expect(aplicarMascaraCuit('2012345678')).toBe('20-12345678');
    expect(aplicarMascaraCuit('20123456786')).toBe('20-12345678-6');
    expect(aplicarMascaraCuit('20-12345678-6999')).toBe('20-12345678-6');
    expect(aplicarMascaraCuit('20.123.456.78-6')).toBe('20-12345678-6');
  });
});
