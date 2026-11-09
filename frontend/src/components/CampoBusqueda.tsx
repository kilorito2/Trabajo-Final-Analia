import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useFiltrosUrl } from '../hooks/useFiltrosUrl';

/** Búsqueda que se refleja en el parámetro `q` de la URL, 300 ms después de dejar de escribir. */
export function CampoBusqueda({ etiqueta }: { etiqueta: string }) {
  const filtros = useFiltrosUrl();
  const [texto, setTexto] = useState(() => filtros.leer('q'));
  const demorado = useDebounce(texto.trim(), 300);
  const ultimoAplicado = useRef(demorado);

  // Solo escribe en la URL cuando cambia lo tipeado, no cuando cambia la URL por otra causa.
  useEffect(() => {
    if (demorado === ultimoAplicado.current) return;
    ultimoAplicado.current = demorado;
    filtros.actualizar({ q: demorado || null }, { reemplazar: true });
  }, [demorado, filtros]);

  return (
    <div className="campo campo--busqueda">
      <label className="campo__etiqueta" htmlFor="busqueda">
        {etiqueta}
      </label>
      <div className="control-con-icono">
        <Search size={16} aria-hidden="true" />
        <input
          id="busqueda"
          className="control"
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>
    </div>
  );
}
