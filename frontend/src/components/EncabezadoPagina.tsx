import type { ReactNode } from 'react';

type PropsEncabezado = {
  titulo: string;
  /** Texto del <title> si difiere del encabezado visible. */
  tituloPestana?: string;
  acciones?: ReactNode;
};

export function EncabezadoPagina({ titulo, tituloPestana = titulo, acciones }: PropsEncabezado) {
  return (
    <header className="encabezado-pagina">
      {/* React 19 lleva el <title> al <head>. */}
      <title>{`${tituloPestana} · Farmacia`}</title>
      <h1>{titulo}</h1>
      {acciones && <div className="encabezado-pagina__acciones">{acciones}</div>}
    </header>
  );
}
