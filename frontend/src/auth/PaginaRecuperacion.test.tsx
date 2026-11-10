import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { json, renderizarRuta } from '../test/renderizar';
import { PaginaIngreso } from './PaginaIngreso';
import { PaginaRecuperacion } from './PaginaRecuperacion';

const rutas = [{ path: 'recuperar', element: <PaginaRecuperacion /> }];

const MENSAJE = 'Si el usuario existe y está activo, le enviamos un código para crear una contraseña nueva.';

describe('Recuperación de contraseña', () => {
  it('pide el código, muestra el correo simulado y crea la contraseña nueva', async () => {
    const usuario = userEvent.setup();
    const { router, api } = renderizarRuta({
      ruta: '/recuperar',
      rutas: [...rutas, { path: 'ingresar', element: <PaginaIngreso /> }],
      usuario: null,
      respuestas: {
        'POST /api/auth/recuperacion': () => json(202, { mensaje: MENSAJE, codigoSimulado: '482913' }),
        'POST /api/auth/recuperacion/confirmar': () => new Response(null, { status: 204 }),
      },
    });

    await usuario.type(await screen.findByRole('textbox', { name: 'Usuario' }), 'farmaceutico');
    await usuario.click(screen.getByRole('button', { name: 'Enviar el código' }));

    expect(await screen.findByText('482913')).toBeInTheDocument();
    await usuario.type(screen.getByRole('textbox', { name: 'Código' }), '482913');
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'clave-nueva-1');
    await usuario.type(screen.getByLabelText('Repetir la contraseña nueva'), 'clave-nueva-1');
    await usuario.click(screen.getByRole('button', { name: 'Crear la contraseña nueva' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
    expect(await screen.findByText('Listo, ya podés ingresar con tu contraseña nueva.')).toBeInTheDocument();
    const confirmacion = api.mock.calls.find(([url]) => String(url).endsWith('/confirmar'));
    expect(JSON.parse(String(confirmacion?.[1]?.body))).toEqual({
      username: 'farmaceutico',
      codigo: '482913',
      passwordNueva: 'clave-nueva-1',
    });
  });

  it('valida el código y que las contraseñas coincidan antes de enviar', async () => {
    const usuario = userEvent.setup();
    const { api } = renderizarRuta({
      ruta: '/recuperar',
      rutas,
      usuario: null,
      respuestas: {
        'POST /api/auth/recuperacion': () => json(202, { mensaje: MENSAJE, codigoSimulado: null }),
      },
    });

    await usuario.type(await screen.findByRole('textbox', { name: 'Usuario' }), 'alguien');
    await usuario.click(screen.getByRole('button', { name: 'Enviar el código' }));
    await usuario.type(await screen.findByRole('textbox', { name: 'Código' }), '12a');
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'clave-nueva-1');
    await usuario.type(screen.getByLabelText('Repetir la contraseña nueva'), 'otra-clave-2');
    await usuario.click(screen.getByRole('button', { name: 'Crear la contraseña nueva' }));

    expect(screen.getByText('El código tiene 6 números.')).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(api.mock.calls.some(([url]) => String(url).endsWith('/confirmar'))).toBe(false);
  });

  it('muestra debajo del campo el error del servidor cuando el código no sirve', async () => {
    const usuario = userEvent.setup();
    renderizarRuta({
      ruta: '/recuperar',
      rutas,
      usuario: null,
      respuestas: {
        'POST /api/auth/recuperacion': () => json(202, { mensaje: MENSAJE, codigoSimulado: '111111' }),
        'POST /api/auth/recuperacion/confirmar': () =>
          json(400, {
            status: 400,
            codigo: 'VALIDACION',
            detail: 'Revisá los datos ingresados.',
            errors: { codigo: 'El código no es válido o ya venció. Pedí uno nuevo.' },
          }),
      },
    });

    await usuario.type(await screen.findByRole('textbox', { name: 'Usuario' }), 'consulta');
    await usuario.click(screen.getByRole('button', { name: 'Enviar el código' }));
    await usuario.type(await screen.findByRole('textbox', { name: 'Código' }), '222222');
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'clave-nueva-1');
    await usuario.type(screen.getByLabelText('Repetir la contraseña nueva'), 'clave-nueva-1');
    await usuario.click(screen.getByRole('button', { name: 'Crear la contraseña nueva' }));

    expect(
      await screen.findByText('El código no es válido o ya venció. Pedí uno nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Código' })).toHaveAttribute('aria-invalid', 'true');
  });
});
