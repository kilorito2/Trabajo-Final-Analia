import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Insignia } from './Insignia';
import { describirEstadoStock, type EstadoStock } from '../utils/estadoStock';

describe('Insignia', () => {
  it.each([
    ['SIN_STOCK', 'Sin stock', 'insignia--peligro'],
    ['STOCK_BAJO', 'Stock bajo', 'insignia--aviso'],
    ['OK', 'OK', 'insignia--ok'],
  ] satisfies [EstadoStock, string, string][])('%s muestra "%s" con la clase %s', (estado, texto, clase) => {
    render(<Insignia {...describirEstadoStock(estado)} />);

    const insignia = screen.getByText(texto);
    expect(insignia).toHaveClass('insignia', clase);
    expect(insignia.textContent?.trim()).not.toBe('');
  });
});
