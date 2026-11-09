import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Confirmacion } from './Confirmacion';

function ConBoton({ alConfirmar = vi.fn() }: { alConfirmar?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Dar de baja
      </button>
      <Confirmacion
        abierto={abierto}
        titulo="Dar de baja el medicamento"
        textoConfirmar="Dar de baja"
        peligro
        alConfirmar={alConfirmar}
        alCancelar={() => setAbierto(false)}
      >
        <p>¿Dar de baja Amoxicilina comprimidos 500 mg?</p>
      </Confirmacion>
    </>
  );
}

describe('Modal y Confirmacion', () => {
  it('abre con el título vinculado y devuelve el foco al cerrar', async () => {
    const usuario = userEvent.setup();
    render(<ConBoton />);
    const disparador = screen.getByRole('button', { name: 'Dar de baja' });

    await usuario.click(disparador);
    const dialogo = screen.getByRole('dialog', { name: 'Dar de baja el medicamento' });
    expect(dialogo).toHaveAttribute('open');

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(dialogo).not.toHaveAttribute('open');
    expect(disparador).toHaveFocus();
  });

  it('confirma con el botón de la acción', async () => {
    const usuario = userEvent.setup();
    const alConfirmar = vi.fn();
    render(<ConBoton alConfirmar={alConfirmar} />);

    await usuario.click(screen.getByRole('button', { name: 'Dar de baja' }));
    const botones = screen.getAllByRole('button', { name: 'Dar de baja' });
    await usuario.click(botones[botones.length - 1]!);

    expect(alConfirmar).toHaveBeenCalledOnce();
  });
});
