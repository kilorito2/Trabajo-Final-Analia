import { useState } from 'react';
import { mensajeDeError } from '../api/errores';
import { useAvisos } from '../components/Avisos';

/**
 * Estado de una descarga en curso. `clave` distingue botones de la misma pantalla (por ejemplo
 * CSV y PDF de un mismo reporte) para mostrar "Descargando…" solo en el que se tocó.
 */
export function useDescarga() {
  const { avisar } = useAvisos();
  const [enCurso, setEnCurso] = useState<string | null>(null);

  async function descargar(clave: string, accion: () => Promise<void>) {
    if (enCurso) return;
    setEnCurso(clave);
    try {
      await accion();
    } catch (error) {
      avisar('error', mensajeDeError(error));
    } finally {
      setEnCurso(null);
    }
  }

  return { enCurso, descargar };
}
