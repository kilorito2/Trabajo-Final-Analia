import type { ReactNode } from 'react';
import { mensajeDeError } from '../api/errores';

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="estado-vacio">{children}</div>;
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="estado-cargando" role="status">
      {texto}
    </div>
  );
}

type PropsErrorCarga = {
  error: unknown;
  alReintentar: () => void;
};

export function ErrorCarga({ error, alReintentar }: PropsErrorCarga) {
  return (
    <div className="estado-error" role="alert">
      <p>{mensajeDeError(error)}</p>
      <button type="button" className="boton" onClick={alReintentar}>
        Reintentar
      </button>
    </div>
  );
}
