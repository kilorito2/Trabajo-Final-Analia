import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatearNumero } from '../utils/numeros';

type PropsPaginador = {
  /** Página actual empezando en 0, como la manda el backend. */
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  tamano: number;
  alCambiar: (pagina: number) => void;
};

export function Paginador({ pagina, totalPaginas, totalElementos, tamano, alCambiar }: PropsPaginador) {
  if (totalElementos === 0) return null;
  const desde = pagina * tamano + 1;
  const hasta = Math.min(totalElementos, (pagina + 1) * tamano);

  return (
    <nav className="paginador" aria-label="Paginación">
      <p>
        Mostrando {formatearNumero(desde)}–{formatearNumero(hasta)} de {formatearNumero(totalElementos)}
      </p>
      <div className="paginador__botones">
        <button
          type="button"
          className="boton boton--chico"
          onClick={() => alCambiar(pagina - 1)}
          disabled={pagina <= 0}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </button>
        <span aria-current="page">
          Página {pagina + 1} de {Math.max(totalPaginas, 1)}
        </span>
        <button
          type="button"
          className="boton boton--chico"
          onClick={() => alCambiar(pagina + 1)}
          disabled={pagina >= totalPaginas - 1}
        >
          Siguiente
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
