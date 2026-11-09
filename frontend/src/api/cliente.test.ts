import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, configurarCliente, descargar } from './cliente';
import { ErrorApi } from './errores';
import { guardarSesion, leerToken } from '../auth/almacenSesion';

const fetchSimulado = vi.fn<typeof fetch>();
const alExpirarSesion = vi.fn();
const alProhibido = vi.fn();

function respuestaJson(status: number, cuerpo?: unknown, cabeceras: Record<string, string> = {}): Response {
  const texto = cuerpo === undefined ? null : JSON.stringify(cuerpo);
  const tipo = status >= 400 ? 'application/problem+json' : 'application/json';
  return new Response(texto, { status, headers: { 'Content-Type': tipo, ...cabeceras } });
}

function ultimoPedido(): { url: string; init: RequestInit; cabeceras: Headers } {
  const llamada = fetchSimulado.mock.calls.at(-1);
  if (!llamada) throw new Error('No hubo pedidos');
  const [url, init = {}] = llamada;
  return { url: String(url), init, cabeceras: new Headers(init.headers) };
}

async function capturarError(promesa: Promise<unknown>): Promise<ErrorApi> {
  try {
    await promesa;
  } catch (error) {
    if (error instanceof ErrorApi) return error;
    throw error;
  }
  throw new Error('Se esperaba un ErrorApi');
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSimulado);
  configurarCliente({ alExpirarSesion, alProhibido });
  guardarSesion({ token: 'token-de-prueba', expiraEn: '2026-11-10T02:00:00Z', usuario: { id: 1 } });
});

afterEach(() => {
  fetchSimulado.mockReset();
  alExpirarSesion.mockReset();
  alProhibido.mockReset();
  vi.useRealTimers();
});

describe('cliente de API', () => {
  it('agrega el Bearer y no manda ninguna cabecera de usuario', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(200, { ok: true }));

    await api.get('/api/medicamentos');

    const { url, cabeceras } = ultimoPedido();
    expect(url).toBe('/api/medicamentos');
    expect(cabeceras.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(cabeceras.get('Accept')).toBe('application/json');
    expect(cabeceras.has('Content-Type')).toBe(false);
    for (const nombre of cabeceras.keys()) {
      expect(nombre).not.toMatch(/user|usuario/i);
    }
  });

  it('manda Content-Type solo cuando hay cuerpo y no agrega datos del usuario', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(201, { id: 7 }));

    await api.post('/api/areas', { nombre: 'Guardia' });

    const { init, cabeceras } = ultimoPedido();
    expect(init.method).toBe('POST');
    expect(cabeceras.get('Content-Type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ nombre: 'Guardia' }));
  });

  it('arma los parámetros, repite los multivalor y omite los vacíos', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(200, {}));

    await api.get('/api/lotes', {
      estado: ['VENCIDO', 'POR_VENCER'],
      medicamentoId: 3,
      activo: true,
      q: '',
      page: undefined,
    });

    expect(ultimoPedido().url).toBe(
      '/api/lotes?estado=VENCIDO&estado=POR_VENCER&medicamentoId=3&activo=true',
    );
  });

  it('sin sesión no manda Authorization', async () => {
    sessionStorage.clear();
    fetchSimulado.mockResolvedValue(respuestaJson(200, {}));

    await api.get('/api/medicamentos');

    expect(ultimoPedido().cabeceras.has('Authorization')).toBe(false);
  });

  it('un 401 fuera del login borra la sesión y llama a alExpirarSesion', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(401, { status: 401, codigo: 'NO_AUTENTICADO' }));

    const error = await capturarError(api.get('/api/medicamentos'));

    expect(error.status).toBe(401);
    expect(leerToken()).toBeNull();
    expect(alExpirarSesion).toHaveBeenCalledOnce();
  });

  it('un 401 en el login devuelve el error sin cerrar nada', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(401, {
        status: 401,
        detail: 'Usuario o contraseña incorrectos.',
        codigo: 'NO_AUTENTICADO',
      }),
    );

    const error = await capturarError(api.post('/api/auth/login', { username: 'admin', password: 'x' }));

    expect(error.message).toBe('Usuario o contraseña incorrectos.');
    expect(alExpirarSesion).not.toHaveBeenCalled();
    expect(leerToken()).toBe('token-de-prueba');
  });

  it('un 403 avisa sin cerrar la sesión', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(403, { status: 403, codigo: 'SIN_PERMISO' }));

    const error = await capturarError(api.post('/api/medicamentos', {}));

    expect(error.status).toBe(403);
    expect(error.message).toBe('No tenés permiso para esta acción.');
    expect(alProhibido).toHaveBeenCalledOnce();
    expect(alExpirarSesion).not.toHaveBeenCalled();
    expect(leerToken()).toBe('token-de-prueba');
  });

  it('un 409 lanza un ErrorApi con los faltantes', async () => {
    const faltantes = [
      { medicamentoId: 4, medicamento: 'Amoxicilina comprimidos 500 mg', disponible: 12, solicitado: 20 },
    ];
    fetchSimulado.mockResolvedValue(
      respuestaJson(409, {
        status: 409,
        title: 'Stock insuficiente',
        detail: 'Stock insuficiente de Amoxicilina comprimidos 500 mg: disponible 12, solicitado 20.',
        codigo: 'STOCK_INSUFICIENTE',
        faltantes,
      }),
    );

    const error = await capturarError(api.post('/api/transferencias', {}));

    expect(error.status).toBe(409);
    expect(error.codigo).toBe('STOCK_INSUFICIENTE');
    expect(error.faltantes).toEqual(faltantes);
    expect(error.message).toContain('disponible 12, solicitado 20');
  });

  it('un 400 trae los errores por campo', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(400, {
        status: 400,
        detail: 'Revisá los datos ingresados.',
        codigo: 'VALIDACION',
        errors: { codigo: 'Ya existe un medicamento con ese código.' },
      }),
    );

    const error = await capturarError(api.post('/api/medicamentos', {}));

    expect(error.codigo).toBe('VALIDACION');
    expect(error.errores).toEqual({ codigo: 'Ya existe un medicamento con ese código.' });
  });

  it('un 500 muestra el código del error', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(500, { status: 500, codigo: 'ERROR_INTERNO', errorId: '3f2a-91' }),
    );

    const error = await capturarError(api.get('/api/resumen'));

    expect(error.message).toBe('Ocurrió un error en el servidor. Código: 3f2a-91.');
  });

  it('un error de red da un mensaje claro', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await capturarError(api.get('/api/resumen'));

    expect(error.tipo).toBe('red');
    expect(error.message).toBe('No se pudo conectar con el servidor.');
  });

  it('un 204 devuelve undefined', async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.patch('/api/areas/1/estado', { activo: false })).resolves.toBeUndefined();
  });

  it('corta a los 15 segundos sin respuesta', async () => {
    vi.useFakeTimers();
    fetchSimulado.mockImplementation(
      (_url, init) =>
        new Promise((_resolver, rechazar) => {
          init?.signal?.addEventListener('abort', () => rechazar(new DOMException('Abortado', 'AbortError')));
        }),
    );

    const promesa = capturarError(api.get('/api/resumen'));
    await vi.advanceTimersByTimeAsync(14_999);
    expect(fetchSimulado.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const error = await promesa;
    expect(error.tipo).toBe('tiempo');
    expect(error.message).toBe('El servidor tardó demasiado en responder.');
  });

  it('descarga el CSV con el nombre de Content-Disposition', async () => {
    const revocarUrl = vi.fn();
    // jsdom no implementa las URL de Blob.
    URL.createObjectURL = vi.fn(() => 'blob:prueba');
    URL.revokeObjectURL = revocarUrl;
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fetchSimulado.mockResolvedValue(
      new Response('﻿Número;Fecha\r\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=UTF-8',
          'Content-Disposition': 'attachment; filename="transferencias_2026-11-01_2026-11-30.csv"',
        },
      }),
    );

    await descargar('/api/transferencias/exportar', { desde: '2026-11-01', hasta: '2026-11-30' });

    expect(ultimoPedido().url).toBe('/api/transferencias/exportar?desde=2026-11-01&hasta=2026-11-30');
    expect(ultimoPedido().cabeceras.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(clic).toHaveBeenCalledOnce();
    const enlace = clic.mock.contexts[0];
    if (!(enlace instanceof HTMLAnchorElement)) throw new Error('No se creó el enlace de descarga');
    expect(enlace.download).toBe('transferencias_2026-11-01_2026-11-30.csv');
    expect(revocarUrl).toHaveBeenCalledWith('blob:prueba');
  });
});
