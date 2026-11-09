import { useFiltrosUrl } from '../hooks/useFiltrosUrl';

/**
 * "Incluir inactivos": sin marcar se manda activo=true; marcada no se manda `activo` y el
 * backend devuelve activos e inactivos.
 */
export function CasillaInactivos({ texto = 'Incluir inactivos' }: { texto?: string }) {
  const filtros = useFiltrosUrl();
  const incluir = filtros.leer('inactivos') === 'si';
  return (
    <label className="casilla">
      <input
        type="checkbox"
        checked={incluir}
        onChange={(e) => filtros.actualizar({ inactivos: e.target.checked ? 'si' : null })}
      />
      {texto}
    </label>
  );
}

/** Valor del filtro `activo` para el backend según la casilla. */
export function filtroActivo(filtros: ReturnType<typeof useFiltrosUrl>): true | undefined {
  return filtros.leer('inactivos') === 'si' ? undefined : true;
}
