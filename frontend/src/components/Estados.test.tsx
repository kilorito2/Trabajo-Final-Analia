import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Cargando, ErrorCarga, Vacio } from './Estados';

describe('estados de carga, vacío y error', () => {
  it('Cargando se anuncia como estado', () => {
    render(<Cargando />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
  });

  it('Vacio muestra el texto que recibe', () => {
    render(<Vacio>No hay lotes vencidos.</Vacio>);
    expect(screen.getByText('No hay lotes vencidos.')).toBeInTheDocument();
  });

  it('ErrorCarga no muestra detalles internos de un error desconocido', () => {
    render(<ErrorCarga error={new Error('TypeError: x is undefined')} alReintentar={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.');
    expect(screen.queryByText(/TypeError/)).toBeNull();
  });
});
