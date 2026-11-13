/**
 * Cruz sanitaria de cuatro brazos redondeados que se entrelazan: cada brazo pasa por encima
 * del siguiente en el sentido del reloj. Va sobre una placa blanca para leerse igual en el
 * menú oscuro y en la tarjeta de ingreso. Decorativo: el nombre va siempre al lado en texto.
 * pathLength="1" permite dibujar cada trazo con stroke-dashoffset (animaciones.css).
 */
function Logo({ tamano = 36 }: { tamano?: number }) {
  return (
    <svg className="logo" width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true">
      <rect className="logo__placa" x="0.5" y="0.5" width="39" height="39" rx="9.5" />
      <path
        className="logo__trazo logo__trazo--oscuro"
        pathLength={1}
        d="M16.4 13.6V10.6A3.6 3.6 0 0 1 23.6 10.6V17.6"
      />
      <path
        className="logo__trazo logo__trazo--claro"
        pathLength={1}
        d="M26.4 16.4H29.4A3.6 3.6 0 0 1 29.4 23.6H22.4"
      />
      <path
        className="logo__trazo logo__trazo--claro"
        pathLength={1}
        d="M23.6 26.4V29.4A3.6 3.6 0 0 1 16.4 29.4V22.4"
      />
      <path
        className="logo__trazo logo__trazo--oscuro"
        pathLength={1}
        d="M13.6 23.6H10.6A3.6 3.6 0 0 1 10.6 16.4H17.6"
      />
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
