import { Link } from 'react-router';
import { EncabezadoPagina } from '../components/EncabezadoPagina';

export function PaginaNoEncontrada() {
  return (
    <div className="pagina-centrada">
      <EncabezadoPagina titulo="No encontramos esta página." tituloPestana="Página inexistente" />
      <p className="texto-suave">Revisá la dirección o volvé al panel.</p>
      <Link to="/">Volver al panel</Link>
    </div>
  );
}
