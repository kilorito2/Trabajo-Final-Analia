import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

type Enlace = { ruta: string; texto: string };
type Grupo = { titulo: string | null; enlaces: Enlace[] };

// El filtrado por permisos (puede()) se suma junto con la sesión, en la rebanada 2.
const GRUPOS: Grupo[] = [
  { titulo: null, enlaces: [{ ruta: '/', texto: 'Panel' }] },
  {
    titulo: 'Operación',
    enlaces: [
      { ruta: '/transferencias/nueva', texto: 'Nueva transferencia' },
      { ruta: '/ingresos/nuevo', texto: 'Ingreso de mercadería' },
      { ruta: '/lotes', texto: 'Lotes y vencimientos' },
    ],
  },
  {
    titulo: 'Consulta',
    enlaces: [
      { ruta: '/medicamentos', texto: 'Medicamentos' },
      { ruta: '/transferencias', texto: 'Transferencias' },
    ],
  },
  {
    titulo: 'Administración',
    enlaces: [
      { ruta: '/proveedores', texto: 'Proveedores' },
      { ruta: '/areas', texto: 'Áreas' },
      { ruta: '/usuarios', texto: 'Usuarios' },
    ],
  },
];

type PropsMenu = {
  id: string;
  abierto: boolean;
  alNavegar: () => void;
  pie?: ReactNode;
};

export function Menu({ id, abierto, alNavegar, pie }: PropsMenu) {
  return (
    <nav id={id} className={abierto ? 'menu menu--abierto' : 'menu'} aria-label="Menú principal">
      <div className="menu__marca">
        Farmacia
        <small>Control de stock</small>
      </div>
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo ?? 'inicio'}>
          {grupo.titulo && <div className="menu__titulo-grupo">{grupo.titulo}</div>}
          <ul className="menu__grupo">
            {grupo.enlaces.map((enlace) => (
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
      ))}
      {pie && <div className="menu__pie">{pie}</div>}
    </nav>
  );
}
