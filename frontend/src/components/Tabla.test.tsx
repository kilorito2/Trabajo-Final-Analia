import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabla, type Columna } from './Tabla';
import { ErrorApi } from '../api/errores';

type Fila = { id: number; nombre: string; stock: number };

const columnas: Columna<Fila>[] = [
  { clave: 'nombre', encabezado: 'Nombre', celda: (f) => f.nombre, campoOrden: 'nombre' },
  { clave: 'stock', encabezado: 'Stock', celda: (f) => f.stock, numero: true },
];

const base = {
  titulo: 'Medicamentos',
  columnas,
  claveFila: (f: Fila) => f.id,
  alReintentar: vi.fn(),
  vacio: 'No hay medicamentos.',
};

describe('Tabla', () => {
  it('marca el orden con aria-sort y lo invierte al hacer clic', async () => {
    const usuario = userEvent.setup();
    const alOrdenar = vi.fn();
    render(
      <Tabla
        {...base}
        filas={[{ id: 1, nombre: 'Amoxicilina', stock: 340 }]}
        cargando={false}
        error={null}
        orden={{ campo: 'nombre', direccion: 'asc' }}
        alOrdenar={alOrdenar}
      />,
    );

    const encabezado = screen.getByRole('columnheader', { name: /Nombre/ });
    expect(encabezado).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Stock' })).not.toHaveAttribute('aria-sort');

    await usuario.click(within(encabezado).getByRole('button'));
    expect(alOrdenar).toHaveBeenCalledWith({ campo: 'nombre', direccion: 'desc' });
  });

  it('muestra el texto de vacío', () => {
    render(<Tabla {...base} filas={[]} cargando={false} error={null} />);
    expect(screen.getByText('No hay medicamentos.')).toBeInTheDocument();
  });

  it('muestra el error con un botón para reintentar', async () => {
    const usuario = userEvent.setup();
    const alReintentar = vi.fn();
    render(
      <Tabla
        {...base}
        alReintentar={alReintentar}
        filas={undefined}
        cargando={false}
        error={new ErrorApi('No se pudo conectar con el servidor.', { tipo: 'red' })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor.');
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(alReintentar).toHaveBeenCalledOnce();
  });

  it('mientras carga muestra un esqueleto y marca la tabla como ocupada', () => {
    render(<Tabla {...base} filas={undefined} cargando error={null} />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });
});
