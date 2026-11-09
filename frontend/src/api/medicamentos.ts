import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import { invalidarStock } from './invalidaciones';
import type {
  EstadoStock,
  IngresoRequest,
  IngresoResponse,
  Medicamento,
  MedicamentoDetalle,
  MedicamentoRequest,
  PaginaMedicamentos,
} from './tipos';

type FiltrosMedicamentos = {
  q?: string;
  estado?: EstadoStock;
  activo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export function useMedicamentos(filtros: FiltrosMedicamentos) {
  return useQuery({
    queryKey: ['medicamentos', 'lista', filtros],
    queryFn: ({ signal }) => api.get<PaginaMedicamentos>('/api/medicamentos', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

export function useMedicamento(id: number | null) {
  return useQuery({
    queryKey: ['medicamentos', 'detalle', id],
    queryFn: ({ signal }) => api.get<MedicamentoDetalle>(`/api/medicamentos/${id}`, undefined, signal),
    enabled: id !== null,
  });
}

/** Búsqueda para el combobox: solo activos, primeros 10 por nombre. */
export function useBuscarMedicamentos(q: string) {
  return useQuery({
    queryKey: ['medicamentos', 'busqueda', q],
    queryFn: ({ signal }) =>
      api.get<PaginaMedicamentos>(
        '/api/medicamentos',
        { q, activo: true, size: 10, sort: 'nombre,asc' },
        signal,
      ),
    enabled: q.trim().length > 0,
  });
}

export function useGuardarMedicamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: MedicamentoRequest }) =>
      id
        ? api.put<Medicamento>(`/api/medicamentos/${id}`, datos)
        : api.post<Medicamento>('/api/medicamentos', datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medicamentos'] }),
  });
}

export function useCambiarEstadoMedicamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      api.patch<void>(`/api/medicamentos/${id}/estado`, { activo }),
    onSuccess: () => invalidarStock(queryClient),
  });
}

export function useRegistrarIngreso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ medicamentoId, datos }: { medicamentoId: number; datos: IngresoRequest }) =>
      api.post<IngresoResponse>(`/api/medicamentos/${medicamentoId}/lotes`, datos),
    onSuccess: () => invalidarStock(queryClient),
  });
}
