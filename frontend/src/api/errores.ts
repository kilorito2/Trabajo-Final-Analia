// Los errores no forman parte del OpenAPI que genera springdoc, así que el formato del
// ProblemDetail (Back_v2 §9) se describe acá.

type Faltante = {
  medicamentoId: number;
  medicamento: string;
  disponible: number;
  solicitado: number;
};

type ProblemDetail = {
  status?: number;
  title?: string;
  detail?: string;
  codigo?: string;
  errors?: Record<string, string>;
  faltantes?: Faltante[];
  errorId?: string;
};

type TipoError = 'http' | 'red' | 'tiempo';

export const MENSAJES = {
  credenciales: 'Usuario o contraseña incorrectos.',
  sesionExpirada: 'Tu sesión expiró. Volvé a ingresar.',
  sinPermiso: 'No tenés permiso para esta acción.',
  red: 'No se pudo conectar con el servidor.',
  tiempo: 'El servidor tardó demasiado en responder.',
  generico: 'No se pudo completar la acción.',
} as const;

export class ErrorApi extends Error {
  readonly status: number;
  readonly tipo: TipoError;
  readonly codigo: string | null;
  readonly errores: Record<string, string>;
  readonly faltantes: Faltante[];

  constructor(mensaje: string, opciones: { status?: number; tipo?: TipoError; problema?: ProblemDetail }) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = opciones.status ?? 0;
    this.tipo = opciones.tipo ?? 'http';
    this.codigo = opciones.problema?.codigo ?? null;
    this.errores = opciones.problema?.errors ?? {};
    this.faltantes = opciones.problema?.faltantes ?? [];
  }

  /** Errores que conviene reintentar: caídas de red y fallas del servidor. */
  get esTransitorio(): boolean {
    return this.tipo === 'red' || this.status >= 500;
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esFaltante(valor: unknown): valor is Faltante {
  return (
    esObjeto(valor) &&
    typeof valor.medicamentoId === 'number' &&
    typeof valor.medicamento === 'string' &&
    typeof valor.disponible === 'number' &&
    typeof valor.solicitado === 'number'
  );
}

function textoOpcional(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor !== '' ? valor : undefined;
}

/** Lee el cuerpo de un error sin confiar en su forma. */
export function leerProblema(cuerpo: unknown): ProblemDetail {
  if (!esObjeto(cuerpo)) return {};
  const errores: Record<string, string> = {};
  if (esObjeto(cuerpo.errors)) {
    for (const [campo, mensaje] of Object.entries(cuerpo.errors)) {
      if (typeof mensaje === 'string') errores[campo] = mensaje;
    }
  }
  return {
    status: typeof cuerpo.status === 'number' ? cuerpo.status : undefined,
    title: textoOpcional(cuerpo.title),
    detail: textoOpcional(cuerpo.detail),
    codigo: textoOpcional(cuerpo.codigo),
    errorId: textoOpcional(cuerpo.errorId),
    errors: errores,
    faltantes: Array.isArray(cuerpo.faltantes) ? cuerpo.faltantes.filter(esFaltante) : [],
  };
}

/** Mensaje para mostrar a partir de cualquier error capturado. */
export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : 'Ocurrió un error inesperado.';
}
