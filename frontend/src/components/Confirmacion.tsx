import type { ReactNode } from 'react';
import { Modal } from './Modal';

type PropsConfirmacion = {
  abierto: boolean;
  titulo: string;
  children: ReactNode;
  textoConfirmar: string;
  textoProcesando?: string;
  peligro?: boolean;
  procesando?: boolean;
  /** Mensaje del backend si la acción falló (por ejemplo, MEDICAMENTO_CON_STOCK). */
  error?: string | null;
  alConfirmar: () => void;
  alCancelar: () => void;
};

export function Confirmacion({
  abierto,
  titulo,
  children,
  textoConfirmar,
  textoProcesando = 'Procesando…',
  peligro = false,
  procesando = false,
  error = null,
  alConfirmar,
  alCancelar,
}: PropsConfirmacion) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      alCerrar={alCancelar}
      bloqueado={procesando}
      pie={
        <>
          <button type="button" className="boton" onClick={alCancelar} disabled={procesando}>
            Cancelar
          </button>
          <button
            type="button"
            className={peligro ? 'boton boton--peligro' : 'boton boton--primario'}
            onClick={alConfirmar}
            disabled={procesando}
          >
            {procesando ? textoProcesando : textoConfirmar}
          </button>
        </>
      }
    >
      {children}
      {error && (
        <p className="mensaje mensaje--peligro" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
