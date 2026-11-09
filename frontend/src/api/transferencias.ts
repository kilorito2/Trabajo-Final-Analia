import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, descargar } from './cliente';
import { invalidarStock } from './invalidaciones';
import type { PaginaTransferencias, Transferencia, TransferenciaRequest } from './tipos';

type FiltrosTransferencias = {
  desde?: string;
  hasta?: string;
  areaId?: number;
  page?: number;
  size?: number;
  sort?: string;
};

export function useTransferencias(filtros: FiltrosTransferencias) {
  return useQuery({
    queryKey: ['transferencias', 'lista', filtros],
    queryFn: ({ signal }) => api.get<PaginaTransferencias>('/api/transferencias', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

export function useTransferencia(id: number) {
  return useQuery({
    queryKey: ['transferencias', 'detalle', id],
    queryFn: ({ signal }) => api.get<Transferencia>(`/api/transferencias/${id}`, undefined, signal),
  });
}

export function useCrearTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: TransferenciaRequest) => api.post<Transferencia>('/api/transferencias', datos),
    onSuccess: (transferencia) => {
      queryClient.setQueryData(['transferencias', 'detalle', transferencia.id], transferencia);
      return invalidarStock(queryClient);
    },
  });
}

/** Descarga el CSV con todo lo filtrado (no solo la página visible). */
export function exportarTransferencias(filtros: { desde: string; hasta: string; areaId?: number }) {
  return descargar('/api/transferencias/exportar', filtros);
}
