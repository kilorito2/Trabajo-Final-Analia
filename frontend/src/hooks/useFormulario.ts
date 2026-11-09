import { useCallback, useState, type ChangeEvent } from 'react';
import { ErrorApi, mensajeDeError } from '../api/errores';

type Valores = Record<string, string | boolean>;

type Validaciones<V extends Valores> = {
  [K in keyof V]?: (valor: V[K], valores: V) => string | null;
};

type Errores<V extends Valores> = Partial<Record<keyof V, string>>;

/** Campos de texto libre, los únicos que se pueden enlazar directo a un input. */
type ClavesTexto<V extends Valores> = {
  [K in keyof V]: string extends V[K] ? K : never;
}[keyof V];

/**
 * Estado y validación de un formulario. Se valida al salir de cada campo y al enviar,
 * nunca en cada tecla. Los errores del servidor se ubican debajo de su campo.
 */
export function useFormulario<V extends Valores>(inicial: V, validaciones: Validaciones<V> = {}) {
  const [valores, setValores] = useState<V>(inicial);
  const [errores, setErrores] = useState<Errores<V>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const validarCampo = useCallback(
    <K extends keyof V>(campo: K, actuales: V): string | null =>
      validaciones[campo]?.(actuales[campo], actuales) ?? null,
    [validaciones],
  );

  const cambiar = useCallback(<K extends keyof V>(campo: K, valor: V[K]) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
  }, []);

  const alSalir = useCallback(
    (campo: keyof V) => {
      setErrores((actuales) => ({ ...actuales, [campo]: validarCampo(campo, valores) ?? undefined }));
    },
    [validarCampo, valores],
  );

  /** Valida todo antes de enviar. Devuelve true si no hay errores. */
  const validarTodo = useCallback((): boolean => {
    const nuevos: Errores<V> = {};
    for (const campo of Object.keys(valores) as (keyof V)[]) {
      const error = validarCampo(campo, valores);
      if (error) nuevos[campo] = error;
    }
    setErrores(nuevos);
    setErrorGeneral(null);
    return Object.keys(nuevos).length === 0;
  }, [validarCampo, valores]);

  /** Ubica los `errors` del ProblemDetail debajo de cada campo y el `detail` arriba del formulario. */
  const aplicarErrorServidor = useCallback(
    (error: unknown) => {
      const deCampos: Errores<V> = {};
      if (error instanceof ErrorApi) {
        for (const [campo, mensaje] of Object.entries(error.errores)) {
          if (campo in valores) deCampos[campo as keyof V] = mensaje;
        }
      }
      setErrores(deCampos);
      setErrorGeneral(mensajeDeError(error));
    },
    [valores],
  );

  const reiniciar = useCallback(
    (nuevos: V = inicial) => {
      setValores(nuevos);
      setErrores({});
      setErrorGeneral(null);
    },
    [inicial],
  );

  /** Props para enlazar un input o textarea de texto libre. */
  const registrar = (campo: ClavesTexto<V>) => ({
    name: String(campo),
    value: String(valores[campo]),
    onChange: (evento: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      cambiar(campo, evento.target.value as V[typeof campo]),
    onBlur: () => alSalir(campo),
  });

  return {
    valores,
    errores,
    errorGeneral,
    cambiar,
    alSalir,
    validarTodo,
    aplicarErrorServidor,
    reiniciar,
    registrar,
  };
}
