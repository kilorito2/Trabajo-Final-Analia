import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { json, renderizarRuta, usuarioDePrueba } from '../test/renderizar';
import { PaginaIngreso } from './PaginaIngreso';
import { RutaProtegida } from './RutaProtegida';
import { leerToken } from './almacenSesion';

const rutas = [
  { path: 'ingresar', element: <PaginaIngreso /> },
  {
    path: 'lotes',
    element: (
      <RutaProtegida>
        <h1>Lotes</h1>
      </RutaProtegida>
    ),
  },
];

describe('Ingreso', () => {
  it('con credenciales inválidas muestra un único mensaje y no guarda sesión', async () => {
    const usuario = userEvent.setup();
    renderizarRuta({
      ruta: '/ingresar',
      rutas,
      usuario: null,
      respuestas: {
        'POST /api/auth/login': () =>
          json(401, { status: 401, codigo: 'NO_AUTENTICADO', detail: 'Usuario o contraseña incorrectos.' }),
      },
    });

    const campoUsuario = await screen.findByRole('textbox', { name: 'Usuario' });
    expect(campoUsuario).toHaveFocus();
    await usuario.type(campoUsuario, 'admin');
    await usuario.type(screen.getByLabelText('Contraseña'), 'equivocada{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.');
    expect(leerToken()).toBeNull();
  });

  it('después de ingresar vuelve a la ruta que se quería abrir', async () => {
    const usuario = userEvent.setup();
    const { router } = renderizarRuta({
      ruta: '/lotes',
      rutas,
      usuario: null,
      respuestas: {
        'POST /api/auth/login': () =>
          json(200, { token: 't-1', expiraEn: '2099-01-01T00:00:00Z', usuario: usuarioDePrueba() }),
      },
    });

    await usuario.type(await screen.findByRole('textbox', { name: 'Usuario' }), 'admin');
    await usuario.type(screen.getByLabelText('Contraseña'), 'demo1234');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/lotes'));
    expect(screen.getByRole('heading', { name: 'Lotes' })).toBeInTheDocument();
    expect(leerToken()).toBe('t-1');
  });

  it('avisa que la sesión expiró cuando se llega con ?motivo=expirada', async () => {
    renderizarRuta({ ruta: '/ingresar?motivo=expirada', rutas, usuario: null });

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu sesión expiró. Volvé a ingresar.');
  });
});
