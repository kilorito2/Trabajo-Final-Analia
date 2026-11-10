import type { ReactNode } from 'react';

/** Pantallas sin sesión (ingreso y recuperación): solo el formulario, centrado. */
export function MarcoIngreso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="ingreso">
      <title>{`${titulo} · Farmacia`}</title>
      {children}
    </main>
  );
}
