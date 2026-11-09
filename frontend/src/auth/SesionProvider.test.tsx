import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { api } from '../api/cliente';
import { Layout } from '../components/Layout';
import { json, renderizarRuta } from '../test/renderizar';
import { formatearHora } from '../utils/fechas';
import { leerToken } from './almacenSesion';
import { RutaProtegida } from './RutaProtegida';

function PaginaConDatos() {
  const consulta = useQuery({ queryKey: ['resumen'], queryFn: () => api.get('/api/resumen') });
  return <h1>{consulta.isError ? 'Error' : 'Datos'}</h1>;
}

const rutas = [
  {
    element: <RutaProtegida />,
    children: [{ element: <Layout />, children: [{ path: 'panel', element: <PaginaConDatos /> }] }],
  },
];

describe('SesionProvider', () => {
  it('avisa 5 minutos antes de que venza la sesión y el aviso queda visible', async () => {
    const expiraEn = new Date(Date.now() + 4 * 60_000).toISOString();
    renderizarRuta({
      ruta: '/panel',
      rutas,
      expiraEn,
      respuestas: { 'GET /api/resumen': () => json(200, {}) },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Tu sesión vence a las ${formatearHora(expiraEn)}. Guardá lo que estés cargando.`,
    );
  });

  it('no avisa si falta más de 5 minutos', async () => {
    renderizarRuta({ ruta: '/panel', rutas, respuestas: { 'GET /api/resumen': () => json(200, {}) } });

    expect(await screen.findByRole('heading', { name: 'Datos' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Salir borra la sesión y vuelve al ingreso', async () => {
    const usuario = userEvent.setup();
    const { router } = renderizarRuta({
      ruta: '/panel',
      rutas,
      respuestas: { 'GET /api/resumen': () => json(200, {}) },
    });

    await usuario.click(await screen.findByRole('button', { name: 'Salir' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
    expect(router.state.location.state).toBeNull();
    expect(leerToken()).toBeNull();
  });

  it('un 401 en medio del uso lleva al ingreso avisando que la sesión expiró', async () => {
    const { router } = renderizarRuta({
      ruta: '/panel',
      rutas,
      respuestas: { 'GET /api/resumen': () => json(401, { status: 401, codigo: 'NO_AUTENTICADO' }) },
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
    expect(router.state.location.search).toBe('?motivo=expirada');
    expect(router.state.location.state).toEqual({ desde: expect.any(String) });
    expect(leerToken()).toBeNull();
  });
});
