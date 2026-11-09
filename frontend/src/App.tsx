import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { crearQueryClient } from './api/consultas';
import { AvisosProvider, useAvisos } from './components/Avisos';
import { Layout } from './components/Layout';
import { LimiteErrores } from './components/LimiteErrores';
import { PaginaSinPermiso } from './auth/PaginaSinPermiso';
import { PaginaNoEncontrada } from './pages/PaginaNoEncontrada';

// Sin loaders: los datos los maneja TanStack Query.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: 'sin-permiso', element: <PaginaSinPermiso /> },
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
]);

function ConConsultas() {
  const { avisar } = useAvisos();
  const [queryClient] = useState(() => crearQueryClient((mensaje) => avisar('error', mensaje)));
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export function App() {
  return (
    <LimiteErrores>
      <AvisosProvider>
        <ConConsultas />
      </AvisosProvider>
    </LimiteErrores>
  );
}
