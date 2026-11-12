import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { vi } from 'vitest';
import type { Permiso, UsuarioSesion } from '../api/tipos';
import { guardarSesion } from '../auth/almacenSesion';
import { SesionProvider } from '../auth/SesionProvider';
import { AvisosProvider } from '../components/Avisos';

type Manejador = (url: URL, init: RequestInit) => Response | Promise<Response>;

export function json(status: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

const TODOS_LOS_PERMISOS: Permiso[] = [
  'LECTURA',
  'CATALOGO_EDITAR',
  'STOCK_INGRESAR',
  'STOCK_BAJA_AJUSTE',
  'TRANSFERENCIA_CREAR',
  'USUARIO_GESTIONAR',
];

export function usuarioDePrueba(permisos: Permiso[] = TODOS_LOS_PERMISOS): UsuarioSesion {
  return { id: 1, username: 'admin', nombreCompleto: 'Analía Gómez', rol: 'ADMIN', permisos };
}

export function pagina<T>(content: T[]) {
  return { content, page: { number: 0, size: 20, totalElements: content.length, totalPages: 1 } };
}

/**
 * Reemplaza fetch por un enrutador simple: "MÉTODO /ruta" → respuesta.
 * Devuelve el mock para revisar los pedidos.
 */
function simularApi(respuestas: Record<string, Manejador>) {
  const simulado = vi.fn(async (entrada: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(entrada), 'http://localhost');
    const manejador = respuestas[`${init.method ?? 'GET'} ${url.pathname}`];
    if (!manejador) return json(404, { status: 404, detail: `Sin respuesta simulada para ${url.pathname}` });
    return manejador(url, init);
  });
  vi.stubGlobal('fetch', simulado);
  return simulado;
}

type Opciones = {
  ruta: string;
  rutas: RouteObject[];
  /** null: sin sesión. */
  usuario?: UsuarioSesion | null;
  respuestas?: Record<string, Manejador>;
  /** Vencimiento de la sesión guardada (por defecto, dentro de 8 horas). */
  expiraEn?: string;
};

/** Renderiza rutas con los mismos proveedores que la app y una sesión ya iniciada. */
export function renderizarRuta({
  ruta,
  rutas,
  usuario = usuarioDePrueba(),
  respuestas = {},
  expiraEn = new Date(Date.now() + 8 * 3_600_000).toISOString(),
}: Opciones) {
  if (usuario) {
    guardarSesion({ token: 'token-de-prueba', expiraEn });
  }
  // Un test puede reemplazar /api/auth/me para simular que la validación de la sesión falla.
  const api = simularApi({ 'GET /api/auth/me': () => json(200, usuario), ...respuestas });
  const router = createMemoryRouter(
    [
      {
        element: (
          <SesionProvider>
            <Outlet />
          </SesionProvider>
        ),
        children: [
          ...rutas,
          { path: 'ingresar', element: <h1>Ingresar</h1> },
          { path: 'sin-permiso', element: <h1>Sin permiso</h1> },
        ],
      },
    ],
    { initialEntries: [ruta] },
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const resultado = render(
    <AvisosProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AvisosProvider>,
  );
  return { ...resultado, router, api };
}
