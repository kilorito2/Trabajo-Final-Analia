import { describe, expect, it } from 'vitest';
import { combinar, cuit, email, entero, longitudEntre, obligatorio } from './validaciones';

describe('validaciones', () => {
  it('obligatorio rechaza vacío y espacios', () => {
    expect(obligatorio('')).not.toBeNull();
    expect(obligatorio('   ')).not.toBeNull();
    expect(obligatorio('x')).toBeNull();
  });

  it('entero acepta solo enteros dentro del rango', () => {
    const cantidad = entero({ minimo: 1, maximo: 50 });
    expect(cantidad('0')).toBe('Tiene que ser mayor que 0.');
    expect(cantidad('-3')).toBe('Ingresá un número entero.');
    expect(cantidad('2.5')).toBe('Ingresá un número entero.');
    expect(cantidad('51')).toBe('No puede superar 50.');
    expect(cantidad('20')).toBeNull();
  });

  it('longitudEntre cuenta sin los espacios de los extremos', () => {
    const motivo = longitudEntre(5, 200);
    expect(motivo('  ab  ')).not.toBeNull();
    expect(motivo('Rotura')).toBeNull();
  });

  it('email es opcional pero tiene que ser válido si se completa', () => {
    expect(email('')).toBeNull();
    expect(email('compras@drogueria.com.ar')).toBeNull();
    expect(email('compras@')).not.toBeNull();
  });

  it('cuit usa el dígito verificador', () => {
    expect(cuit('20-12345678-6')).toBeNull();
    expect(cuit('20-12345678-5')).not.toBeNull();
  });

  it('combinar devuelve el primer error', () => {
    const validar = combinar(obligatorio, longitudEntre(8, 72));
    expect(validar('')).toBe('Completá este campo.');
    expect(validar('corta')).toBe('Tiene que tener al menos 8 caracteres.');
    expect(validar('suficientemente larga')).toBeNull();
  });
});
