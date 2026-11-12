import { useId } from 'react';

/**
 * Escudo institucional con cruz sanitaria. Decorativo: el nombre va siempre al lado en texto.
 * El id del degradé es único porque el logo se dibuja dos veces (barra superior y menú).
 */
function Logo({ tamano = 36 }: { tamano?: number }) {
  // useId trae caracteres (":" o "«»") que no siempre sirven dentro de url(#...).
  const degrade = `logo-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg className="logo" width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={degrade} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1bb5a9" />
          <stop offset="1" stopColor="#0a6170" />
        </linearGradient>
      </defs>
      <path fill={`url(#${degrade})`} d="M20 2 35 7.5V19c0 9.4-6.4 16.4-15 19C11.4 35.4 5 28.4 5 19V7.5Z" />
      <path className="logo__anillo" d="M20 5.2 32 9.6V19c0 7.8-5.2 13.7-12 16-6.8-2.3-12-8.2-12-16V9.6Z" />
      <rect className="logo__cruz" x="16.5" y="10" width="7" height="18" rx="1.6" />
      <rect className="logo__cruz" x="11" y="15.5" width="18" height="7" rx="1.6" />
    </svg>
  );
}

export function Marca({ subtitulo = 'Gestión de stock' }: { subtitulo?: string }) {
  return (
    <div className="marca">
      <Logo />
      <div className="marca__texto">
        <span className="marca__nombre">Farmacia Hospitalaria</span>
        <span className="marca__subtitulo">{subtitulo}</span>
      </div>
    </div>
  );
}
