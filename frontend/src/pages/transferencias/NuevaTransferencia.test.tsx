import { screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Medicamento } from '../../api/tipos';
import { json, pagina, renderizarRuta } from '../../test/renderizar';
import { PaginaNuevaTransferencia } from './PaginaNuevaTransferencia';

const amoxicilina: Medicamento = {
  id: 4,
  codigo: 'AMX500',
  nombre: 'Amoxicilina',
  presentacion: 'comprimidos 500 mg',
  stockMinimo: 200,
  stockTotal: 340,
  estadoStock: 'OK',
  proximoVencimiento: '2026-12-20',
  activo: true,
};

const ceftriaxona: Medicamento = {
  ...amoxicilina,
  id: 7,
  codigo: 'CEF1G',
  nombre: 'Ceftriaxona',
  presentacion: 'frasco ampolla 1 g',
  stockTotal: 85,
};

const respuestasBase = {
  'GET /api/areas': () => json(200, pagina([{ id: 2, nombre: 'Guardia', activo: true }])),
  'GET /api/medicamentos': (url: URL) => {
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    return json(200, pagina([amoxicilina, ceftriaxona].filter((m) => m.nombre.toLowerCase().includes(q))));
  },
};

function renderizar(respuestas = {}) {
  return renderizarRuta({
    ruta: '/transferencias/nueva',
    rutas: [
      { path: 'transferencias/nueva', element: <PaginaNuevaTransferencia /> },
      { path: 'transferencias/:id', element: <h1>Comprobante</h1> },
    ],
    respuestas: { ...respuestasBase, ...respuestas },
  });
}

async function agregar(usuario: UserEvent, busqueda: string, cantidad: string) {
  await usuario.type(await screen.findByRole('combobox', { name: /Medicamento/ }), busqueda);
  await usuario.click(await screen.findByRole('option', { name: new RegExp(busqueda, 'i') }));
  const campoCantidad = screen.getByRole('spinbutton', { name: /Cantidad a agregar/ });
  await usuario.clear(campoCantidad);
  await usuario.type(campoCantidad, cantidad);
  await usuario.click(screen.getByRole('button', { name: 'Agregar' }));
}

async function elegirArea(usuario: UserEvent) {
  const selector = await screen.findByRole('combobox', { name: /Área de destino/ });
  await within(selector).findByRole('option', { name: 'Guardia' });
  await usuario.selectOptions(selector, 'Guardia');
}

describe('Nueva transferencia', () => {
  it('exige el área de destino', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole('heading', { name: 'Nueva transferencia' });
    await agregar(usuario, 'Amox', '5');

    await usuario.click(screen.getByRole('button', { name: 'Revisar y confirmar' }));

    expect(screen.getByRole('combobox', { name: /Área de destino/ })).toHaveAccessibleDescription(
      'Elegí el área de destino.',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('marca en la línea una cantidad menor o igual a 0 o mayor al stock', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await agregar(usuario, 'Amox', '5');
    const linea = screen.getByRole('spinbutton', { name: 'Cantidad de Amoxicilina comprimidos 500 mg' });

    await usuario.clear(linea);
    await usuario.type(linea, '0');
    await usuario.tab();
    expect(linea).toHaveAccessibleDescription('Tiene que ser mayor que 0.');

    await usuario.clear(linea);
    await usuario.type(linea, '341');
    await usuario.tab();
    expect(linea).toHaveAccessibleDescription('No puede superar 340.');
  });

  it('suma un medicamento repetido a su línea y lo avisa', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await agregar(usuario, 'Amox', '5');
    await agregar(usuario, 'Amox', '3');

    expect(screen.getAllByRole('spinbutton', { name: /^Cantidad de / })).toHaveLength(1);
    expect(
      screen.getByRole('spinbutton', { name: 'Cantidad de Amoxicilina comprimidos 500 mg' }),
    ).toHaveValue(8);
    expect(
      await screen.findByText('Se sumó a la línea de Amoxicilina comprimidos 500 mg.'),
    ).toBeInTheDocument();
  });

  it('un doble clic en confirmar envía un solo pedido', async () => {
    const usuario = userEvent.setup();
    let pedidos = 0;
    const { router } = renderizar({
      'POST /api/transferencias': async () => {
        pedidos++;
        await new Promise((r) => setTimeout(r, 50));
        return json(201, {
          id: 123,
          numero: 'TR-000123',
          fechaHora: '2026-11-09T17:49:00-03:00',
          area: { id: 2, nombre: 'Guardia' },
          realizadaPor: { id: 1, nombreCompleto: 'Analía Gómez' },
          observaciones: null,
          detalle: [],
        });
      },
    });
    await elegirArea(usuario);
    await agregar(usuario, 'Amox', '5');
    await usuario.click(screen.getByRole('button', { name: 'Revisar y confirmar' }));

    const resumen = screen.getByRole('dialog', { name: 'Confirmar la transferencia' });
    expect(within(resumen).getByText('335')).toBeInTheDocument();
    await usuario.dblClick(within(resumen).getByRole('button', { name: 'Confirmar transferencia' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/transferencias/123'));
    expect(pedidos).toBe(1);
  });

  it('ante un 409 marca las líneas con faltantes y conserva lo cargado', async () => {
    const usuario = userEvent.setup();
    renderizar({
      'POST /api/transferencias': () =>
        json(409, {
          status: 409,
          codigo: 'STOCK_INSUFICIENTE',
          detail: 'Stock insuficiente de Amoxicilina comprimidos 500 mg: disponible 12, solicitado 20.',
          faltantes: [
            {
              medicamentoId: 4,
              medicamento: 'Amoxicilina comprimidos 500 mg',
              disponible: 12,
              solicitado: 20,
            },
          ],
        }),
    });
    await elegirArea(usuario);
    await agregar(usuario, 'Amox', '20');
    await agregar(usuario, 'Ceft', '2');
    await usuario.type(screen.getByRole('textbox', { name: /Observaciones/ }), 'Pedido urgente');
    await usuario.click(screen.getByRole('button', { name: 'Revisar y confirmar' }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar transferencia' }));

    expect(await screen.findByText('Disponible: 12 (pediste 20)')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('combobox', { name: /Área de destino/ })).toHaveDisplayValue('Guardia');
    expect(
      screen.getByRole('spinbutton', { name: 'Cantidad de Amoxicilina comprimidos 500 mg' }),
    ).toHaveValue(20);
    expect(
      screen.getByRole('spinbutton', { name: 'Cantidad de Ceftriaxona frasco ampolla 1 g' }),
    ).toHaveValue(2);
    expect(screen.getByRole('textbox', { name: /Observaciones/ })).toHaveValue('Pedido urgente');
  });

  it('restaura el borrador al volver a la página', async () => {
    const usuario = userEvent.setup();
    const primera = renderizar();
    await elegirArea(usuario);
    await agregar(usuario, 'Ceft', '4');
    primera.unmount();

    renderizar();

    expect(
      await screen.findByRole('spinbutton', { name: 'Cantidad de Ceftriaxona frasco ampolla 1 g' }),
    ).toHaveValue(4);
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Área de destino/ })).toHaveDisplayValue('Guardia'),
    );
  });
});
