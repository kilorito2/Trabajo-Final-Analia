import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type PropsModal = {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: boolean;
  /** Mientras se envía algo, Escape y el botón de cerrar no hacen nada. */
  bloqueado?: boolean;
};

export function Modal({
  abierto,
  titulo,
  alCerrar,
  children,
  pie,
  ancho = false,
  bloqueado = false,
}: PropsModal) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const disparador = useRef<HTMLElement | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierto && !elemento.open) {
      disparador.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      elemento.showModal();
    } else if (!abierto && elemento.open) {
      elemento.close();
      disparador.current?.focus();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className={ancho ? 'modal modal--ancho' : 'modal'}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        // Escape: el estado lo maneja el padre, así que se cancela el cierre nativo.
        evento.preventDefault();
        if (!bloqueado) alCerrar();
      }}
    >
      {abierto && (
        <>
          <div className="modal__encabezado">
            <h2 id={idTitulo}>{titulo}</h2>
            <button
              type="button"
              className="boton-icono"
              aria-label="Cerrar"
              onClick={alCerrar}
              disabled={bloqueado}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="modal__cuerpo">{children}</div>
          {pie && <div className="modal__pie">{pie}</div>}
        </>
      )}
    </dialog>
  );
}
