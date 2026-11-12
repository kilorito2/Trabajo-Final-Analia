import { useState } from 'react';
import { useFiltrosUrl } from '../hooks/useFiltrosUrl';

/**
 * "Incluir inactivos": sin marcar se manda activo=true; marcada no se manda `activo` y el
 * backend devuelve activos e inactivos.
 */
export function CasillaInactivos({ texto = 'Incluir inactivos' }: { texto?: string }) {
  const filtros = useFiltrosUrl();
  const enUrl = filtros.leer('inactivos') === 'si';
  // React Router cambia la URL en una transición: si la casilla leyera solo la URL, tardaría en
  // marcarse mientras se recarga la lista. Responde al instante y se resincroniza si la URL cambia
  // por otra causa (Atrás, un enlace).
  const [incluir, setIncluir] = useState(enUrl);
  const [ultimaUrl, setUltimaUrl] = useState(enUrl);
  if (ultimaUrl !== enUrl) {
    setUltimaUrl(enUrl);
    setIncluir(enUrl);
  }
  return (
    <label className="casilla">
      <input
        type="checkbox"
        checked={incluir}
        onChange={(e) => {
          setIncluir(e.target.checked);
          filtros.actualizar({ inactivos: e.target.checked ? 'si' : null });
        }}
      />
      {texto}
    </label>
  );
}

/** Valor del filtro `activo` para el backend según la casilla. */
export function filtroActivo(filtros: ReturnType<typeof useFiltrosUrl>): true | undefined {
  return filtros.leer('inactivos') === 'si' ? undefined : true;
}
