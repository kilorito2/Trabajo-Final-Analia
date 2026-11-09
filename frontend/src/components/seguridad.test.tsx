import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tabla } from './Tabla';

describe('seguridad', () => {
  it('un nombre con HTML se muestra como texto y no se interpreta', () => {
    const malicioso = '<img src=x onerror=alert(1)>';
    const { container } = render(
      <Tabla
        titulo="Medicamentos"
        columnas={[{ clave: 'nombre', encabezado: 'Nombre', celda: (f: { nombre: string }) => f.nombre }]}
        filas={[{ nombre: malicioso }]}
        claveFila={(f) => f.nombre}
        cargando={false}
        error={null}
        alReintentar={() => {}}
        vacio="—"
      />,
    );

    expect(screen.getByText(malicioso)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
