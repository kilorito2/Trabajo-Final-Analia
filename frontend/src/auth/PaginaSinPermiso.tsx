import { Link } from 'react-router';
import { EncabezadoPagina } from '../components/EncabezadoPagina';

export function PaginaSinPermiso() {
  return (
    <div className="pagina-centrada">
      <EncabezadoPagina titulo="No tenés permiso para ver esta página." tituloPestana="Sin permiso" />
      <p className="texto-suave">Si necesitás acceso, pedíselo a quien administra el sistema.</p>
      <Link to="/">Volver al panel</Link>
    </div>
  );
}
