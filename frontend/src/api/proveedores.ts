import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import type { PaginaProveedores, Proveedor, ProveedorRequest } from './tipos';

type FiltrosProveedores = { q?: string; activo?: boolean; page?: number; size?: number; sort?: string };

export function useProveedores(filtros: FiltrosProveedores) {
  return useQuery({
    queryKey: ['proveedores', filtros],
    queryFn: ({ signal }) => api.get<PaginaProveedores>('/api/proveedores', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

/** Proveedores que se pueden elegir en un ingreso nuevo. */
export function useProveedoresActivos() {
  return useProveedores({ activo: true, size: 100, sort: 'razonSocial,asc' });
}

export function useGuardarProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: ProveedorRequest }) =>
      id
        ? api.put<Proveedor>(`/api/proveedores/${id}`, datos)
        : api.post<Proveedor>('/api/proveedores', datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
  });
}

export function useCambiarEstadoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      api.patch<void>(`/api/proveedores/${id}/estado`, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
  });
}
