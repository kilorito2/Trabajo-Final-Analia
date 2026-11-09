import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarRuta, usuarioDePrueba } from '../test/renderizar';
import { RutaProtegida } from './RutaProtegida';

const rutas = [
  {
    element: <RutaProtegida />,
    children: [
      { path: 'medicamentos', element: <h1>Medicamentos</h1> },
      {
        path: 'usuarios',
        element: (
          <RutaProtegida permiso="USUARIO_GESTIONAR">
            <h1>Usuarios</h1>
          </RutaProtegida>
        ),
      },
    ],
  },
];

describe('RutaProtegida', () => {
  it('sin sesión lleva al ingreso y recuerda adónde se quería ir', async () => {
    const { router } = renderizarRuta({ ruta: '/medicamentos?q=amox', rutas, usuario: null });

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ desde: '/medicamentos?q=amox' });
  });

  it('sin el permiso lleva a "Sin permiso"', async () => {
    renderizarRuta({ ruta: '/usuarios', rutas, usuario: usuarioDePrueba(['LECTURA']) });

    expect(await screen.findByRole('heading', { name: 'Sin permiso' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).toBeNull();
  });

  it('con sesión y permiso muestra la página', async () => {
    renderizarRuta({ ruta: '/usuarios', rutas });

    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('valida la sesión guardada con /api/auth/me antes de mostrar nada', async () => {
    const { api } = renderizarRuta({ ruta: '/medicamentos', rutas });

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
    await waitFor(() => expect(api).toHaveBeenCalledWith('/api/auth/me', expect.anything()));
    expect(await screen.findByRole('heading', { name: 'Medicamentos' })).toBeInTheDocument();
  });
});
