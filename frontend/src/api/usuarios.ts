import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import type { PaginaUsuarios, Usuario, UsuarioEdicionRequest, UsuarioRequest } from './tipos';

type FiltrosUsuarios = { q?: string; activo?: boolean; page?: number; size?: number; sort?: string };

export function useUsuarios(filtros: FiltrosUsuarios) {
  return useQuery({
    queryKey: ['usuarios', filtros],
    queryFn: ({ signal }) => api.get<PaginaUsuarios>('/api/usuarios', filtros, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: UsuarioRequest) => api.post<Usuario>('/api/usuarios', datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useEditarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UsuarioEdicionRequest }) =>
      api.put<Usuario>(`/api/usuarios/${id}`, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      api.patch<void>(`/api/usuarios/${id}/estado`, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useRestablecerPassword() {
  return useMutation({
    mutationFn: ({ id, passwordNueva }: { id: number; passwordNueva: string }) =>
      api.patch<void>(`/api/usuarios/${id}/password`, { passwordNueva }),
  });
}
