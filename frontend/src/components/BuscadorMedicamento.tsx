import { useId, useState, type KeyboardEvent } from 'react';
import { useBuscarMedicamentos } from '../api/medicamentos';
import type { Medicamento } from '../api/tipos';
import { useDebounce } from '../hooks/useDebounce';
import { formatearNumero } from '../utils/numeros';
import { CampoFormulario } from './CampoFormulario';
import { nombreCompleto } from '../utils/medicamento';

type PropsBuscador = {
  etiqueta: string;
  obligatorio?: boolean;
  error?: string | null;
  ayuda?: string;
  /** Texto inicial (por ejemplo, el medicamento ya elegido al venir desde su detalle). */
  textoInicial?: string;
  /** Recibe null cuando se edita el texto después de haber elegido. */
  alElegir: (medicamento: Medicamento | null) => void;
  /** Después de elegir, vacía el campo para buscar otro (nueva transferencia). */
  vaciarAlElegir?: boolean;
};

/** Combobox accesible (patrón ARIA 1.2 con listbox): flechas, Enter y Escape. */
export function BuscadorMedicamento({
  etiqueta,
  obligatorio = false,
  error,
  ayuda,
  textoInicial = '',
  alElegir,
  vaciarAlElegir = false,
}: PropsBuscador) {
  const idLista = useId();
  const [texto, setTexto] = useState(textoInicial);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const busqueda = useDebounce(texto.trim(), 300);
  const { data, isFetching, isError } = useBuscarMedicamentos(abierto ? busqueda : '');
  const opciones = data?.content ?? [];
  const mostrarLista = abierto && busqueda.length > 0;

  function elegir(medicamento: Medicamento) {
    setTexto(vaciarAlElegir ? '' : nombreCompleto(medicamento));
    setAbierto(false);
    setActivo(-1);
    alElegir(medicamento);
  }

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        setAbierto(true);
        setActivo((i) => Math.min(i + 1, opciones.length - 1));
        break;
      case 'ArrowUp':
        evento.preventDefault();
        setActivo((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        const elegida = opciones[activo];
        if (mostrarLista && elegida) {
          evento.preventDefault();
          elegir(elegida);
        }
        break;
      }
      case 'Escape':
        if (abierto) {
          evento.preventDefault();
          evento.stopPropagation();
          setAbierto(false);
          setActivo(-1);
        }
        break;
    }
  }

  const idOpcion = (i: number) => `${idLista}-opcion-${i}`;
  let estado: string | null = null;
  if (mostrarLista && isError) estado = 'No se pudo buscar. Probá de nuevo.';
  else if (mostrarLista && isFetching && opciones.length === 0) estado = 'Buscando…';
  else if (mostrarLista && !isFetching && opciones.length === 0)
    estado = 'No hay medicamentos activos con ese código o nombre.';

  return (
    <CampoFormulario
      etiqueta={etiqueta}
      obligatorio={obligatorio}
      error={error}
      ayuda={ayuda ?? 'Escribí el código o el nombre.'}
    >
      {(props) => (
        <div className="combobox">
          <input
            {...props}
            className="control"
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={mostrarLista && opciones.length > 0}
            aria-controls={idLista}
            aria-activedescendant={mostrarLista && activo >= 0 ? idOpcion(activo) : undefined}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setAbierto(true);
              setActivo(-1);
              alElegir(null);
            }}
            onKeyDown={alTeclear}
            onBlur={() => setAbierto(false)}
          />
          <ul
            id={idLista}
            role="listbox"
            aria-label={etiqueta}
            className="combobox__lista"
            hidden={!mostrarLista || opciones.length === 0}
          >
            {opciones.map((medicamento, i) => (
              // El teclado lo maneja el input con aria-activedescendant (patrón ARIA de combobox).
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={medicamento.id}
                id={idOpcion(i)}
                role="option"
                aria-selected={i === activo}
                className="combobox__opcion"
                // mousedown evita que el input pierda el foco antes del clic.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(medicamento)}
              >
                <span>{nombreCompleto(medicamento)}</span>
                <span className="texto-suave texto-sm">
                  {medicamento.codigo} · Stock: {formatearNumero(medicamento.stockTotal)}
                </span>
              </li>
            ))}
          </ul>
          {estado && (
            <p className="combobox__estado texto-sm" role="status">
              {estado}
            </p>
          )}
        </div>
      )}
    </CampoFormulario>
  );
}
