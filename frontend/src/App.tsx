import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router';
import { crearQueryClient } from './api/consultas';
import { PaginaIngreso } from './auth/PaginaIngreso';
import { PaginaRecuperacion } from './auth/PaginaRecuperacion';
import { PaginaSinPermiso } from './auth/PaginaSinPermiso';
import { RutaProtegida } from './auth/RutaProtegida';
import { SesionProvider } from './auth/SesionProvider';
import { AvisosProvider, useAvisos } from './components/Avisos';
import { Layout } from './components/Layout';
import { LimiteErrores } from './components/LimiteErrores';
import { PaginaAreas } from './pages/areas/PaginaAreas';
import { PaginaCuenta } from './pages/cuenta/PaginaCuenta';
import { PaginaIngresoMercaderia } from './pages/ingresos/PaginaIngresoMercaderia';
import { PaginaLotes } from './pages/lotes/PaginaLotes';
import { PaginaDetalleMedicamento } from './pages/medicamentos/PaginaDetalleMedicamento';
import { PaginaFormularioMedicamento } from './pages/medicamentos/PaginaFormularioMedicamento';
import { PaginaMedicamentos } from './pages/medicamentos/PaginaMedicamentos';
import { PaginaNoEncontrada } from './pages/PaginaNoEncontrada';
import { PaginaPanel } from './pages/panel/PaginaPanel';
import { PaginaProveedores } from './pages/proveedores/PaginaProveedores';
import { PaginaReportes } from './pages/reportes/PaginaReportes';
import { PaginaComprobante } from './pages/transferencias/PaginaComprobante';
import { PaginaNuevaTransferencia } from './pages/transferencias/PaginaNuevaTransferencia';
import { PaginaTransferencias } from './pages/transferencias/PaginaTransferencias';
import { PaginaUsuarios } from './pages/usuarios/PaginaUsuarios';

// Sin loaders: los datos los maneja TanStack Query. El SesionProvider va dentro del
// router para poder navegar al ingreso cuando la sesión vence.
const router = createBrowserRouter([
  {
    element: (
      <SesionProvider>
        <Outlet />
      </SesionProvider>
    ),
    children: [
      { path: 'ingresar', element: <PaginaIngreso /> },
      { path: 'recuperar', element: <PaginaRecuperacion /> },
      {
        element: <RutaProtegida />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: 'sin-permiso', element: <PaginaSinPermiso /> },
              { path: 'cuenta', element: <PaginaCuenta /> },
              {
                element: <RutaProtegida permiso="LECTURA" />,
                children: [
                  { index: true, element: <PaginaPanel /> },
                  { path: 'medicamentos', element: <PaginaMedicamentos /> },
                  {
                    path: 'medicamentos/nuevo',
                    element: (
                      <RutaProtegida permiso="CATALOGO_EDITAR">
                        <PaginaFormularioMedicamento />
                      </RutaProtegida>
                    ),
                  },
                  { path: 'medicamentos/:id', element: <PaginaDetalleMedicamento /> },
                  {
                    path: 'medicamentos/:id/editar',
                    element: (
                      <RutaProtegida permiso="CATALOGO_EDITAR">
                        <PaginaFormularioMedicamento />
                      </RutaProtegida>
                    ),
                  },
                  {
                    path: 'ingresos/nuevo',
                    element: (
                      <RutaProtegida permiso="STOCK_INGRESAR">
                        <PaginaIngresoMercaderia />
                      </RutaProtegida>
                    ),
                  },
                  {
                    path: 'transferencias/nueva',
                    element: (
                      <RutaProtegida permiso="TRANSFERENCIA_CREAR">
                        <PaginaNuevaTransferencia />
                      </RutaProtegida>
                    ),
                  },
                  { path: 'transferencias', element: <PaginaTransferencias /> },
                  { path: 'transferencias/:id', element: <PaginaComprobante /> },
                  { path: 'lotes', element: <PaginaLotes /> },
                  { path: 'reportes', element: <PaginaReportes /> },
                  { path: 'proveedores', element: <PaginaProveedores /> },
                  { path: 'areas', element: <PaginaAreas /> },
                  {
                    path: 'usuarios',
                    element: (
                      <RutaProtegida permiso="USUARIO_GESTIONAR">
                        <PaginaUsuarios />
                      </RutaProtegida>
                    ),
                  },
                ],
              },
              { path: '*', element: <PaginaNoEncontrada /> },
            ],
          },
        ],
      },
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
