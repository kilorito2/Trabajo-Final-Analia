import { Component, type ReactNode } from 'react';

type Estado = { fallo: boolean };

/** ErrorBoundary: si una pantalla rompe al renderizar, se muestra un mensaje en vez de una página en blanco. */
export class LimiteErrores extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <main className="pagina-centrada pagina-error">
        <h1>Ocurrió un error inesperado</h1>
        <p>La pantalla no se pudo mostrar. Recargá la página para seguir trabajando.</p>
        <button type="button" className="boton boton--primario" onClick={() => window.location.reload()}>
          Recargar la página
        </button>
      </main>
    );
  }
}
