import { describe, expect, it, vi } from 'vitest';
import { crearQueryClient, debeReintentar } from './consultas';
import { ErrorApi } from './errores';

describe('política de consultas', () => {
  it('reintenta una sola vez ante errores de red o 5xx', () => {
    const red = new ErrorApi('x', { tipo: 'red' });
    const servidor = new ErrorApi('x', { status: 503 });
    expect(debeReintentar(0, red)).toBe(true);
    expect(debeReintentar(0, servidor)).toBe(true);
    expect(debeReintentar(1, red)).toBe(false);
  });

  it('nunca reintenta un 4xx ni un tiempo agotado', () => {
    expect(debeReintentar(0, new ErrorApi('x', { status: 404 }))).toBe(false);
    expect(debeReintentar(0, new ErrorApi('x', { status: 409 }))).toBe(false);
    expect(debeReintentar(0, new ErrorApi('x', { tipo: 'tiempo' }))).toBe(false);
    expect(debeReintentar(0, new Error('otro'))).toBe(false);
  });

  it('las mutaciones avisan los errores de servidor pero no los de validación', async () => {
    const avisar = vi.fn();
    const cliente = crearQueryClient(avisar);
    const mutaciones = cliente.getMutationCache();

    await mutaciones
      .build(cliente, {
        mutationFn: () => Promise.reject(new ErrorApi('Falla del servidor', { status: 500 })),
      })
      .execute(undefined)
      .catch(() => {});
    await mutaciones
      .build(cliente, { mutationFn: () => Promise.reject(new ErrorApi('Campo inválido', { status: 400 })) })
      .execute(undefined)
      .catch(() => {});

    expect(avisar).toHaveBeenCalledTimes(1);
    expect(avisar).toHaveBeenCalledWith('Falla del servidor');
  });
});
