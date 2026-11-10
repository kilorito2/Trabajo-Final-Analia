/** Cruz sanitaria sobre un cuadrado redondeado. Decorativa: el nombre va siempre al lado en texto. */
export function Logo({ tamano = 32 }: { tamano?: number }) {
  return (
    <svg className="logo" width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true">
      <rect className="logo__fondo" width="32" height="32" rx="8" />
      <path className="logo__cruz" d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" />
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
