import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import { invalidarStock } from './invalidaciones';
import type {
  AjusteLoteRequest,
  BajaLoteRequest,
  EstadoLote,
  Lote,
  PaginaLotes,
  PaginaMovimientos,
} from './tipos';

type FiltrosLotes = {
  /** Código, nombre o presentación del medicamento, número de lote o proveedor. */
  q?: string;
  medicamentoId?: number;
  estado?: readonly EstadoLote[];
  page?: number;
  size?: number;
  sort?: string;
};

export function useLotes(filtros: FiltrosLotes) {
  return useQuery({
    queryKey: ['lotes', filtros],
    queryFn: ({ signal }) => api.get<PaginaLotes>('/api/lotes', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

type FiltrosMovimientos = { medicamentoId?: number; page?: number; size?: number; sort?: string };

export function useMovimientos(filtros: FiltrosMovimientos) {
  return useQuery({
    queryKey: ['movimientos', filtros],
    queryFn: ({ signal }) => api.get<PaginaMovimientos>('/api/movimientos', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDarDeBajaLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: BajaLoteRequest }) =>
      api.post<Lote>(`/api/lotes/${id}/baja`, datos),
    onSuccess: () => invalidarStock(queryClient),
  });
}

export function useAjustarLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AjusteLoteRequest }) =>
      api.post<Lote>(`/api/lotes/${id}/ajuste`, datos),
    onSuccess: () => invalidarStock(queryClient),
  });
}
