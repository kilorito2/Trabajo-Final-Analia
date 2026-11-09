import { borrarSesionGuardada, leerToken } from '../auth/almacenSesion';
import { guardarArchivo, nombreDesdeContentDisposition } from '../utils/descargas';
import { ErrorApi, MENSAJES, leerProblema } from './errores';

// Único lugar de la aplicación que llama a fetch.

type ValorParametro = string | number | boolean | null | undefined;
export type Parametros = Record<string, ValorParametro | readonly (string | number)[]>;

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH';

// El cliente no importa el router ni el contexto de sesión: recibe estos callbacks del
// SesionProvider. Así queda desacoplado de React y se puede testear solo.
type ConfiguracionCliente = {
  alExpirarSesion: () => void;
  alProhibido: () => void;
};

const RUTA_LOGIN = '/api/auth/login';
const TIEMPO_MAXIMO_MS = 15_000;
const BASE = import.meta.env.VITE_API_URL ?? '';

let configuracion: ConfiguracionCliente = {
  alExpirarSesion: () => {},
  alProhibido: () => {},
};

export function configurarCliente(nueva: ConfiguracionCliente): void {
  configuracion = nueva;
}

function construirUrl(ruta: string, parametros?: Parametros): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    const valores = Array.isArray(valor) ? valor : [valor];
    for (const v of valores) {
      if (v !== undefined && v !== null && v !== '') busqueda.append(clave, String(v));
    }
  }
  const consulta = busqueda.toString();
  return `${BASE}${ruta}${consulta ? `?${consulta}` : ''}`;
}

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text();
  if (!texto) return undefined;
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

async function errorDesdeRespuesta(ruta: string, respuesta: Response): Promise<ErrorApi> {
  const problema = leerProblema(await leerCuerpo(respuesta));
  const { status } = respuesta;

  if (status === 401 && ruta === RUTA_LOGIN) {
    return new ErrorApi(MENSAJES.credenciales, { status, problema });
  }
  if (status === 401) {
    borrarSesionGuardada();
    configuracion.alExpirarSesion();
    return new ErrorApi(MENSAJES.sesionExpirada, { status, problema });
  }
  if (status === 403) {
    configuracion.alProhibido();
    return new ErrorApi(MENSAJES.sinPermiso, { status, problema });
  }
  if (status >= 500) {
    const codigo = problema.errorId ? ` Código: ${problema.errorId}.` : '';
    return new ErrorApi(`Ocurrió un error en el servidor.${codigo}`, { status, problema });
  }
  return new ErrorApi(problema.detail ?? MENSAJES.generico, { status, problema });
}

async function ejecutar(
  ruta: string,
  opciones: {
    metodo: Metodo;
    cuerpo?: unknown;
    parametros?: Parametros;
    acepta: string;
    senal?: AbortSignal;
  },
): Promise<Response> {
  const cabeceras = new Headers({ Accept: opciones.acepta });
  const token = leerToken();
  if (token) cabeceras.set('Authorization', `Bearer ${token}`);
  if (opciones.cuerpo !== undefined) cabeceras.set('Content-Type', 'application/json');

  const controlador = new AbortController();
  let vencido = false;
  const temporizador = setTimeout(() => {
    vencido = true;
    controlador.abort();
  }, TIEMPO_MAXIMO_MS);
  const cancelarExterno = () => controlador.abort();
  opciones.senal?.addEventListener('abort', cancelarExterno);

  try {
    const respuesta = await fetch(construirUrl(ruta, opciones.parametros), {
      method: opciones.metodo,
      headers: cabeceras,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      signal: controlador.signal,
    });
    if (!respuesta.ok) throw await errorDesdeRespuesta(ruta, respuesta);
    return respuesta;
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    if (vencido) throw new ErrorApi(MENSAJES.tiempo, { tipo: 'tiempo' });
    // Una cancelación pedida desde afuera (TanStack Query al desmontar) se propaga tal cual.
    if (opciones.senal?.aborted) throw error;
    throw new ErrorApi(MENSAJES.red, { tipo: 'red' });
  } finally {
    clearTimeout(temporizador);
    opciones.senal?.removeEventListener('abort', cancelarExterno);
  }
}

async function pedirJson<T>(
  metodo: Metodo,
  ruta: string,
  extra: { cuerpo?: unknown; parametros?: Parametros; senal?: AbortSignal } = {},
): Promise<T> {
  const respuesta = await ejecutar(ruta, { metodo, acepta: 'application/json', ...extra });
  // Frontera con el backend: la forma de T la garantizan los tipos generados de su OpenAPI.
  return (await leerCuerpo(respuesta)) as T;
}

export const api = {
  get: <T>(ruta: string, parametros?: Parametros, senal?: AbortSignal) =>
    pedirJson<T>('GET', ruta, { parametros, senal }),
  post: <T>(ruta: string, cuerpo?: unknown) => pedirJson<T>('POST', ruta, { cuerpo }),
  put: <T>(ruta: string, cuerpo: unknown) => pedirJson<T>('PUT', ruta, { cuerpo }),
  patch: <T>(ruta: string, cuerpo: unknown) => pedirJson<T>('PATCH', ruta, { cuerpo }),
};

/** Pide un archivo (el CSV de transferencias) y dispara su descarga. */
export async function descargar(ruta: string, parametros?: Parametros): Promise<void> {
  const respuesta = await ejecutar(ruta, { metodo: 'GET', parametros, acepta: 'text/csv' });
  const nombre = nombreDesdeContentDisposition(
    respuesta.headers.get('Content-Disposition'),
    'exportacion.csv',
  );
  guardarArchivo(await respuesta.blob(), nombre);
}
