import { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu as IconoMenu } from 'lucide-react';
import { Marca } from './Logo';
import { Menu } from './Menu';

const ID_MENU = 'menu-principal';

export function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="layout">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <div className="barra-superior">
        <Marca />
        <button
          type="button"
          className="boton"
          aria-expanded={menuAbierto}
          aria-controls={ID_MENU}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <IconoMenu size={18} aria-hidden="true" />
          Menú
        </button>
      </div>
      <Menu id={ID_MENU} abierto={menuAbierto} alNavegar={() => setMenuAbierto(false)} />
      <main id="contenido" className="contenido" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
