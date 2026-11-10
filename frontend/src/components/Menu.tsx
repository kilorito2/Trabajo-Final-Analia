import { NavLink } from 'react-router';
import {
  ArrowRightLeft,
  Building2,
  CalendarClock,
  CircleUserRound,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pill,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permiso } from '../api/tipos';
import { useSesion } from '../auth/SesionProvider';
import { nombreRol } from '../utils/roles';
import { Marca } from './Logo';

type Enlace = { ruta: string; texto: string; permiso: Permiso; icono: LucideIcon };
type Grupo = { titulo: string | null; enlaces: Enlace[] };

const GRUPOS: Grupo[] = [
  { titulo: null, enlaces: [{ ruta: '/', texto: 'Panel', permiso: 'LECTURA', icono: LayoutDashboard }] },
  {
    titulo: 'Operación',
    enlaces: [
      {
        ruta: '/transferencias/nueva',
        texto: 'Nueva transferencia',
        permiso: 'TRANSFERENCIA_CREAR',
        icono: ArrowRightLeft,
      },
      {
        ruta: '/ingresos/nuevo',
        texto: 'Ingreso de mercadería',
        permiso: 'STOCK_INGRESAR',
        icono: PackagePlus,
      },
      { ruta: '/lotes', texto: 'Lotes y vencimientos', permiso: 'LECTURA', icono: CalendarClock },
    ],
  },
  {
    titulo: 'Consulta',
    enlaces: [
      { ruta: '/medicamentos', texto: 'Medicamentos', permiso: 'LECTURA', icono: Pill },
      { ruta: '/transferencias', texto: 'Transferencias', permiso: 'LECTURA', icono: ClipboardList },
      { ruta: '/reportes', texto: 'Reportes', permiso: 'LECTURA', icono: FileChartColumn },
    ],
  },
  {
    titulo: 'Administración',
    enlaces: [
      { ruta: '/proveedores', texto: 'Proveedores', permiso: 'LECTURA', icono: Truck },
      { ruta: '/areas', texto: 'Áreas', permiso: 'LECTURA', icono: Building2 },
      { ruta: '/usuarios', texto: 'Usuarios', permiso: 'USUARIO_GESTIONAR', icono: Users },
    ],
  },
];

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras =
    partes.length > 1 ? `${partes[0]?.[0] ?? ''}${partes.at(-1)?.[0] ?? ''}` : (partes[0] ?? '?').slice(0, 2);
  return letras.toUpperCase();
}

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
        <Marca />
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
                    <enlace.icono size={18} aria-hidden="true" />
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
            <span className="menu__avatar" aria-hidden="true">
              {iniciales(usuario.nombreCompleto)}
            </span>
            <div className="menu__usuario-datos">
              <strong>{usuario.nombreCompleto}</strong>
              <span>
                {usuario.username} · {nombreRol(usuario.rol)}
              </span>
            </div>
          </div>
          <ul className="menu__grupo">
            <li>
              <NavLink to="/cuenta" className="menu__enlace" onClick={alNavegar}>
                <CircleUserRound size={18} aria-hidden="true" />
                Mi cuenta
              </NavLink>
            </li>
          </ul>
          <button type="button" className="boton boton--texto menu__salir" onClick={cerrarSesion}>
            <LogOut size={18} aria-hidden="true" />
            Salir
          </button>
        </div>
      )}
    </nav>
  );
}
