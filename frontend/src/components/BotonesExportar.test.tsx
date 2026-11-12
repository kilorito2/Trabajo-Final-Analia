import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginaMedicamentos } from '../pages/medicamentos/PaginaMedicamentos';
import { json, pagina, renderizarRuta } from '../test/renderizar';

describe('BotonesExportar', () => {
  const clic = vi.fn();

  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clic);
    // jsdom no implementa las URL de Blob.
    URL.createObjectURL = vi.fn(() => 'blob:prueba');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => clic.mockReset());

  it('exporta los medicamentos en Excel con los filtros de la pantalla', async () => {
    const usuario = userEvent.setup();
    const { api } = renderizarRuta({
      ruta: '/medicamentos?q=amox&estado=STOCK_BAJO',
      rutas: [{ path: 'medicamentos', element: <PaginaMedicamentos /> }],
      respuestas: {
        'GET /api/medicamentos': () => json(200, pagina([])),
        'GET /api/medicamentos/exportar': () =>
          new Response('contenido', {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': 'attachment; filename="stock_medicamentos.xlsx"',
            },
          }),
      },
    });

    await usuario.click(await screen.findByRole('button', { name: /Excel/ }));

    await waitFor(() => expect(clic).toHaveBeenCalledOnce());
    const [url] = api.mock.calls.find(([u]) => String(u).includes('/api/medicamentos/exportar')) ?? [];
    expect(String(url)).toBe('/api/medicamentos/exportar?q=amox&estado=STOCK_BAJO&activo=true&formato=XLSX');
  });
});
