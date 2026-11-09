import { NavLink } from 'react-router';
import { LogOut } from 'lucide-react';
import type { Permiso } from '../api/tipos';
import { useSesion } from '../auth/SesionProvider';
import { nombreRol } from '../utils/roles';

type Enlace = { ruta: string; texto: string; permiso: Permiso };
type Grupo = { titulo: string | null; enlaces: Enlace[] };

const GRUPOS: Grupo[] = [
  { titulo: null, enlaces: [{ ruta: '/', texto: 'Panel', permiso: 'LECTURA' }] },
  {
    titulo: 'Operación',
    enlaces: [
      { ruta: '/transferencias/nueva', texto: 'Nueva transferencia', permiso: 'TRANSFERENCIA_CREAR' },
      { ruta: '/ingresos/nuevo', texto: 'Ingreso de mercadería', permiso: 'STOCK_INGRESAR' },
      { ruta: '/lotes', texto: 'Lotes y vencimientos', permiso: 'LECTURA' },
    ],
  },
  {
    titulo: 'Consulta',
    enlaces: [
      { ruta: '/medicamentos', texto: 'Medicamentos', permiso: 'LECTURA' },
      { ruta: '/transferencias', texto: 'Transferencias', permiso: 'LECTURA' },
    ],
  },
  {
    titulo: 'Administración',
    enlaces: [
      { ruta: '/proveedores', texto: 'Proveedores', permiso: 'LECTURA' },
      { ruta: '/areas', texto: 'Áreas', permiso: 'LECTURA' },
      { ruta: '/usuarios', texto: 'Usuarios', permiso: 'USUARIO_GESTIONAR' },
    ],
  },
];

type PropsMenu = {
  id: string;
  abierto: boolean;
  alNavegar: () => void;
};

export function Menu({ id, abierto, alNavegar }: PropsMenu) {
  const { usuario, puede, cerrarSesion } = useSesion();

  return (
    <nav id={id} className={abierto ? 'menu menu--abierto' : 'menu'} aria-label="Menú principal">
      <div className="menu__marca">
        Farmacia
        <small>Control de stock</small>
      </div>
      {GRUPOS.map((grupo) => {
        const visibles = grupo.enlaces.filter((enlace) => puede(enlace.permiso));
        if (visibles.length === 0) return null;
        return (
          <div key={grupo.titulo ?? 'inicio'}>
            {grupo.titulo && <div className="menu__titulo-grupo">{grupo.titulo}</div>}
            <ul className="menu__grupo">
              {visibles.map((enlace) => (
                <li key={enlace.ruta}>
                  <NavLink
                    to={enlace.ruta}
                    end={enlace.ruta === '/' || enlace.ruta === '/transferencias'}
                    className="menu__enlace"
                    onClick={alNavegar}
                  >
                    {enlace.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {usuario && (
        <div className="menu__pie">
          <div className="menu__usuario">
            <strong>{usuario.nombreCompleto}</strong>
            <span className="texto-suave">
              {usuario.username} · {nombreRol(usuario.rol)}
            </span>
          </div>
          <ul className="menu__grupo">
            <li>
              <NavLink to="/cuenta" className="menu__enlace" onClick={alNavegar}>
                Mi cuenta
              </NavLink>
            </li>
          </ul>
          <button type="button" className="boton boton--texto menu__salir" onClick={cerrarSesion}>
            <LogOut size={16} aria-hidden="true" />
            Salir
          </button>
        </div>
      )}
    </nav>
  );
}
