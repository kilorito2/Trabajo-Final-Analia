import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useFiltrosUrl } from './useFiltrosUrl';

function crearEnvoltorio(url: string) {
  return function Envoltorio({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  };
}

function useFiltrosYUbicacion() {
  return { filtros: useFiltrosUrl(), ubicacion: useLocation() };
}

describe('useFiltrosUrl', () => {
  it('lee la página desde 1 en la URL y la pasa desde 0 al backend', () => {
    const { result } = renderHook(useFiltrosUrl, {
      wrapper: crearEnvoltorio('/medicamentos?pagina=3&orden=nombre,desc&estado=SIN_STOCK'),
    });

    expect(result.current.pagina).toBe(2);
    expect(result.current.orden).toEqual({ campo: 'nombre', direccion: 'desc' });
    expect(result.current.ordenApi).toBe('nombre,desc');
    expect(result.current.leer('estado')).toBe('SIN_STOCK');
  });

  it('ignora una página o un orden inválidos', () => {
    const { result } = renderHook(useFiltrosUrl, {
      wrapper: crearEnvoltorio('/medicamentos?pagina=-2&orden=nombre,arriba'),
    });

    expect(result.current.pagina).toBe(0);
    expect(result.current.orden).toBeNull();
  });

  it('cambiar un filtro vuelve a la primera página y repite los valores múltiples', () => {
    const { result } = renderHook(useFiltrosYUbicacion, {
      wrapper: crearEnvoltorio('/lotes?pagina=4'),
    });

    act(() => result.current.filtros.actualizar({ estado: ['VENCIDO', 'POR_VENCER'] }));

    expect(result.current.ubicacion.search).toBe('?estado=VENCIDO&estado=POR_VENCER');
  });

  it('irAPagina conserva los filtros y omite la página 1', () => {
    const { result } = renderHook(useFiltrosYUbicacion, {
      wrapper: crearEnvoltorio('/medicamentos?q=amox'),
    });

    act(() => result.current.filtros.irAPagina(1));
    expect(result.current.ubicacion.search).toBe('?q=amox&pagina=2');

    act(() => result.current.filtros.irAPagina(0));
    expect(result.current.ubicacion.search).toBe('?q=amox');
  });
});
