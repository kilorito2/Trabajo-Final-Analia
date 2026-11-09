import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { Orden } from '../components/Tabla';

type Cambios = Record<string, string | readonly string[] | null | undefined>;

/**
 * Filtros, orden y página viven en la URL: así funcionan los enlaces del panel, el botón
 * Atrás y el refresco del navegador. En la URL la página empieza en 1; hacia el backend, en 0.
 */
export function useFiltrosUrl() {
  const [parametros, setParametros] = useSearchParams();

  const actualizar = useCallback(
    (cambios: Cambios, opciones: { reemplazar?: boolean } = {}) => {
      setParametros(
        (actuales) => {
          const nuevos = new URLSearchParams(actuales);
          for (const [clave, valor] of Object.entries(cambios)) {
            nuevos.delete(clave);
            const valores = typeof valor === 'string' ? [valor] : (valor ?? []);
            for (const v of valores) {
              if (v !== '') nuevos.append(clave, v);
            }
          }
          // Cualquier cambio de filtro u orden vuelve a la primera página.
          if (!('pagina' in cambios)) nuevos.delete('pagina');
          return nuevos;
        },
        { replace: opciones.reemplazar ?? false },
      );
    },
    [setParametros],
  );

  return useMemo(() => {
    const paginaUrl = Number(parametros.get('pagina') ?? '1');
    const pagina = Number.isInteger(paginaUrl) && paginaUrl > 0 ? paginaUrl - 1 : 0;

    const [campo, direccion] = (parametros.get('orden') ?? '').split(',');
    const orden: Orden | null =
      campo && (direccion === 'asc' || direccion === 'desc') ? { campo, direccion } : null;

    return {
      leer: (clave: string, porDefecto = '') => parametros.get(clave) ?? porDefecto,
      leerTodos: (clave: string) => parametros.getAll(clave),
      /** Página para el backend (desde 0). */
      pagina,
      orden,
      /** Valor de `sort` para el backend: "campo,asc". */
      ordenApi: orden ? `${orden.campo},${orden.direccion}` : undefined,
      actualizar,
      irAPagina: (paginaApi: number) => actualizar({ pagina: paginaApi > 0 ? String(paginaApi + 1) : null }),
      ordenar: (nuevo: Orden) => actualizar({ orden: `${nuevo.campo},${nuevo.direccion}` }),
    };
  }, [parametros, actualizar]);
}
