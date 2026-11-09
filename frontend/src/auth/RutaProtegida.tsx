import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import type { Permiso } from '../api/tipos';
import { useSesion } from './SesionProvider';

type PropsRutaProtegida = {
  permiso?: Permiso;
  children?: ReactNode;
};

/**
 * Sin sesión lleva al ingreso (recordando adónde se quería ir); sin el permiso, a "Sin permiso".
 * Ocultar algo en la interfaz no reemplaza la seguridad: el backend valida igual.
 */
export function RutaProtegida({ permiso, children }: PropsRutaProtegida) {
  const { usuario, motivoSalida, puede } = useSesion();
  const ubicacion = useLocation();

  if (!usuario) {
    // Después de "Salir" no se recuerda la página: la próxima persona empieza en el panel.
    if (motivoSalida === 'salida') return <Navigate to="/ingresar" replace />;
    return (
      <Navigate
        to={motivoSalida === 'expirada' ? '/ingresar?motivo=expirada' : '/ingresar'}
        replace
        state={{ desde: ubicacion.pathname + ubicacion.search }}
      />
    );
  }
  if (permiso && !puede(permiso)) {
    return <Navigate to="/sin-permiso" replace />;
  }
  return children ?? <Outlet />;
}
