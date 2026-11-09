import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Paginador } from './Paginador';

describe('Paginador', () => {
  it('muestra la página desde 1 aunque el backend cuente desde 0', async () => {
    const usuario = userEvent.setup();
    const alCambiar = vi.fn();
    render(<Paginador pagina={1} totalPaginas={7} totalElementos={135} tamano={20} alCambiar={alCambiar} />);

    expect(screen.getByText('Mostrando 21–40 de 135')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 7')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(alCambiar).toHaveBeenCalledWith(2);
  });

  it('deshabilita Anterior en la primera página y Siguiente en la última', () => {
    render(<Paginador pagina={0} totalPaginas={1} totalElementos={5} tamano={20} alCambiar={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});
