import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import type { Area, AreaRequest, PaginaAreas } from './tipos';

type FiltrosAreas = { q?: string; activo?: boolean; page?: number; size?: number; sort?: string };

export function useAreas(filtros: FiltrosAreas) {
  return useQuery({
    queryKey: ['areas', filtros],
    queryFn: ({ signal }) => api.get<PaginaAreas>('/api/areas', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

/** Áreas que pueden recibir transferencias, para los selectores. */
export function useAreasActivas() {
  return useAreas({ activo: true, size: 100, sort: 'nombre,asc' });
}

export function useGuardarArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: AreaRequest }) =>
      id ? api.put<Area>(`/api/areas/${id}`, datos) : api.post<Area>('/api/areas', datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  });
}

export function useCambiarEstadoArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      api.patch<void>(`/api/areas/${id}/estado`, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  });
}
