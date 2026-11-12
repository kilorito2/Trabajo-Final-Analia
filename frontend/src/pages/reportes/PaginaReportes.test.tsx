import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { json, pagina, renderizarRuta } from '../../test/renderizar';
import { PaginaReportes } from './PaginaReportes';

function archivo(tipo: string, nombre: string): Response {
  return new Response('contenido', {
    status: 200,
    headers: { 'Content-Type': tipo, 'Content-Disposition': `attachment; filename="${nombre}"` },
  });
}

describe('Reportes', () => {
  const clic = vi.fn();

  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clic);
    // jsdom no implementa las URL de Blob.
    URL.createObjectURL = vi.fn(() => 'blob:prueba');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => clic.mockReset());

  function renderizar() {
    return renderizarRuta({
      ruta: '/reportes',
      rutas: [{ path: 'reportes', element: <PaginaReportes /> }],
      respuestas: {
        'GET /api/areas': () => json(200, pagina([{ id: 3, nombre: 'Guardia', activo: true }])),
        'GET /api/medicamentos/exportar': (url) =>
          archivo(
            url.searchParams.get('formato') === 'PDF' ? 'application/pdf' : 'text/csv',
            `stock_medicamentos.${url.searchParams.get('formato') === 'PDF' ? 'pdf' : 'csv'}`,
          ),
        'GET /api/lotes/exportar': () => archivo('application/pdf', 'lotes_vencimientos.pdf'),
        'GET /api/alertas/exportar': () =>
          archivo('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'alertas.xlsx'),
      },
    });
  }

  it('exporta el stock en PDF con los filtros elegidos', async () => {
    const usuario = userEvent.setup();
    const { api } = renderizar();

    const tarjeta = (await screen.findByRole('heading', { name: 'Stock de medicamentos' })).closest(
      'section',
    );
    if (!tarjeta) throw new Error('No se encontró la tarjeta del reporte');
    await usuario.selectOptions(within(tarjeta).getByLabelText('Estado'), 'STOCK_BAJO');
    await usuario.click(within(tarjeta).getByRole('button', { name: 'PDF' }));

    await waitFor(() => expect(clic).toHaveBeenCalledOnce());
    const [url, init] = api.mock.calls.find(([u]) => String(u).includes('/api/medicamentos/exportar')) ?? [];
    expect(String(url)).toBe('/api/medicamentos/exportar?estado=STOCK_BAJO&activo=true&formato=PDF');
    expect(new Headers(init?.headers).get('Accept')).toBe('application/pdf');
    expect(within(tarjeta).getByRole('link', { name: 'Ver en pantalla' })).toHaveAttribute(
      'href',
      '/medicamentos?estado=STOCK_BAJO',
    );
  });

  it('el reporte de lotes pide vencidos y por vencer por defecto', async () => {
    const usuario = userEvent.setup();
    const { api } = renderizar();

    const tarjeta = (await screen.findByRole('heading', { name: 'Lotes y vencimientos' })).closest('section');
    if (!tarjeta) throw new Error('No se encontró la tarjeta del reporte');
    await usuario.click(within(tarjeta).getByRole('button', { name: 'PDF' }));

    await waitFor(() => expect(clic).toHaveBeenCalledOnce());
    const [url] = api.mock.calls.find(([u]) => String(u).includes('/api/lotes/exportar')) ?? [];
    expect(String(url)).toBe('/api/lotes/exportar?estado=VENCIDO&estado=POR_VENCER&formato=PDF');
  });

  it('exporta las alertas en Excel', async () => {
    const usuario = userEvent.setup();
    const { api } = renderizar();

    const tarjeta = (await screen.findByRole('heading', { name: 'Alertas' })).closest('section');
    if (!tarjeta) throw new Error('No se encontró la tarjeta del reporte');
    await usuario.click(within(tarjeta).getByRole('button', { name: 'Excel' }));

    await waitFor(() => expect(clic).toHaveBeenCalledOnce());
    const [url] = api.mock.calls.find(([u]) => String(u).includes('/api/alertas/exportar')) ?? [];
    expect(String(url)).toBe('/api/alertas/exportar?formato=XLSX');
  });

  it('no deja exportar transferencias con un rango de fechas invertido', async () => {
    const usuario = userEvent.setup();
    renderizar();

    const tarjeta = (await screen.findByRole('heading', { name: 'Transferencias a áreas' })).closest(
      'section',
    );
    if (!tarjeta) throw new Error('No se encontró la tarjeta del reporte');
    const desde = within(tarjeta).getByLabelText('Desde');
    await usuario.clear(desde);
    await usuario.type(desde, '2099-01-01');

    expect(
      within(tarjeta).getByText('La fecha "desde" no puede ser posterior a "hasta".'),
    ).toBeInTheDocument();
    expect(within(tarjeta).getByRole('button', { name: 'PDF' })).toBeDisabled();
    expect(within(tarjeta).getByRole('button', { name: 'Excel' })).toBeDisabled();
  });
});
