import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useFormulario } from './useFormulario';
import { CampoFormulario } from '../components/CampoFormulario';
import { ErrorApi } from '../api/errores';
import { obligatorio } from '../utils/validaciones';

const validaciones = { codigo: obligatorio };

function Formulario({ alEnviar, errorServidor }: { alEnviar: () => void; errorServidor?: ErrorApi }) {
  const formulario = useFormulario({ codigo: '', nombre: '' }, validaciones);
  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        if (errorServidor) {
          formulario.aplicarErrorServidor(errorServidor);
          return;
        }
        if (formulario.validarTodo()) alEnviar();
      }}
    >
      {formulario.errorGeneral && <p role="alert">{formulario.errorGeneral}</p>}
      <CampoFormulario etiqueta="Código" obligatorio error={formulario.errores.codigo}>
        {(props) => <input {...props} {...formulario.registrar('codigo')} />}
      </CampoFormulario>
      <CampoFormulario etiqueta="Nombre" error={formulario.errores.nombre}>
        {(props) => <input {...props} {...formulario.registrar('nombre')} />}
      </CampoFormulario>
      <button type="submit">Guardar</button>
    </form>
  );
}

describe('useFormulario y CampoFormulario', () => {
  it('valida al salir del campo, no en cada tecla', async () => {
    const usuario = userEvent.setup();
    render(<Formulario alEnviar={vi.fn()} />);
    const codigo = screen.getByRole('textbox', { name: /Código/ });

    await usuario.click(codigo);
    expect(codigo).toHaveAttribute('aria-invalid', 'false');

    await usuario.tab();
    expect(codigo).toHaveAttribute('aria-invalid', 'true');
    expect(codigo).toHaveAccessibleDescription('Completá este campo.');

    await usuario.type(codigo, 'A');
    expect(codigo).toHaveAttribute('aria-invalid', 'true');
    await usuario.tab();
    expect(codigo).toHaveAttribute('aria-invalid', 'false');
  });

  it('si el foco pasa al botón de enviar, no valida al salir: lo hace el envío', async () => {
    const usuario = userEvent.setup();
    render(<Formulario alEnviar={vi.fn()} />);
    const codigo = screen.getByRole('textbox', { name: /Código/ });
    await usuario.click(codigo);
    await usuario.tab();
    await usuario.type(codigo, 'A');

    fireEvent.blur(codigo, { relatedTarget: screen.getByRole('button', { name: 'Guardar' }) });

    // El mensaje sigue en su lugar hasta el envío: así el botón no se mueve mientras se aprieta.
    expect(codigo).toHaveAttribute('aria-invalid', 'true');
  });

  it('indica los obligatorios con texto', () => {
    render(<Formulario alEnviar={vi.fn()} />);
    expect(screen.getByText('(obligatorio)')).toBeInTheDocument();
  });

  it('valida todo al enviar y no envía si hay errores', async () => {
    const usuario = userEvent.setup();
    const alEnviar = vi.fn();
    render(<Formulario alEnviar={alEnviar} />);

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(alEnviar).not.toHaveBeenCalled();
    expect(screen.getByText('Completá este campo.')).toBeInTheDocument();

    await usuario.type(screen.getByRole('textbox', { name: /Código/ }), 'AMX500');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(alEnviar).toHaveBeenCalledOnce();
  });

  it('muestra los errores del servidor debajo del campo y el detail arriba', async () => {
    const usuario = userEvent.setup();
    const error = new ErrorApi('Ya existe un medicamento con el código AMX500.', {
      status: 409,
      problema: { codigo: 'CODIGO_DUPLICADO', errors: { nombre: 'El nombre es demasiado largo.' } },
    });
    render(<Formulario alEnviar={vi.fn()} errorServidor={error} />);

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un medicamento con el código AMX500.');
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAccessibleDescription(
      'El nombre es demasiado largo.',
    );
  });
});
