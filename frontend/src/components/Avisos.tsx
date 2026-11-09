import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

type TipoAviso = 'exito' | 'error' | 'advertencia' | 'info';

type Aviso = { id: number; tipo: TipoAviso; mensaje: string };

type OpcionesAviso = {
  /** Si es true, el aviso queda hasta que se cierra a mano. Los errores siempre quedan. */
  fijo?: boolean;
};

type ContextoAvisos = {
  avisar: (tipo: TipoAviso, mensaje: string, opciones?: OpcionesAviso) => number;
  cerrar: (id: number) => void;
};

const DURACION_EXITO_MS = 5_000;

const Contexto = createContext<ContextoAvisos | null>(null);

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(1);

  const cerrar = useCallback((id: number) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }, []);

  const avisar = useCallback(
    (tipo: TipoAviso, mensaje: string, opciones: OpcionesAviso = {}) => {
      const id = siguienteId.current++;
      setAvisos((actuales) => [...actuales, { id, tipo, mensaje }]);
      const seCierraSolo = (tipo === 'exito' || tipo === 'info') && !opciones.fijo;
      if (seCierraSolo) {
        setTimeout(() => cerrar(id), DURACION_EXITO_MS);
      }
      return id;
    },
    [cerrar],
  );

  const valor = useMemo(() => ({ avisar, cerrar }), [avisar, cerrar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="avisos">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`aviso aviso--${aviso.tipo}`}
            role={aviso.tipo === 'error' || aviso.tipo === 'advertencia' ? 'alert' : 'status'}
          >
            <p>{aviso.mensaje}</p>
            <button
              type="button"
              className="boton-icono"
              aria-label="Cerrar aviso"
              onClick={() => cerrar(aviso.id)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos(): ContextoAvisos {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAvisos tiene que usarse dentro de AvisosProvider');
  return contexto;
}
