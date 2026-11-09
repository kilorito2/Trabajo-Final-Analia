import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MetadatosPagina } from '../api/tipos';
import { formatearNumero } from '../utils/numeros';

type PropsPaginador = {
  /** Metadatos tal como los manda el backend (`number` empieza en 0). */
  pagina: MetadatosPagina;
  alCambiar: (pagina: number) => void;
};

export function Paginador({ pagina, alCambiar }: PropsPaginador) {
  const { number, size, totalElements, totalPages } = pagina;
  if (totalElements === 0) return null;
  const desde = number * size + 1;
  const hasta = Math.min(totalElements, (number + 1) * size);

  return (
    <nav className="paginador" aria-label="Paginación">
      <p>
        Mostrando {formatearNumero(desde)}–{formatearNumero(hasta)} de {formatearNumero(totalElements)}
      </p>
      <div className="paginador__botones">
        <button
          type="button"
          className="boton boton--chico"
          onClick={() => alCambiar(number - 1)}
          disabled={number <= 0}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </button>
        <span>
          Página {number + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="boton boton--chico"
          onClick={() => alCambiar(number + 1)}
          disabled={number >= totalPages - 1}
        >
          Siguiente
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
