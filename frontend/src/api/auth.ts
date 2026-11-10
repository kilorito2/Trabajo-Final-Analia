import { useMutation } from '@tanstack/react-query';
import { api } from './cliente';
import type {
  CambioPasswordRequest,
  ConfirmacionRecuperacionRequest,
  LoginRequest,
  LoginResponse,
  SolicitudRecuperacionRequest,
  SolicitudRecuperacionResponse,
  UsuarioSesion,
} from './tipos';

export const iniciarSesion = (datos: LoginRequest) => api.post<LoginResponse>('/api/auth/login', datos);

export const solicitarRecuperacion = (datos: SolicitudRecuperacionRequest) =>
  api.post<SolicitudRecuperacionResponse>('/api/auth/recuperacion', datos);

export const confirmarRecuperacion = (datos: ConfirmacionRecuperacionRequest) =>
  api.post<void>('/api/auth/recuperacion/confirmar', datos);

export const obtenerUsuarioActual = () => api.get<UsuarioSesion>('/api/auth/me');

export function useCambiarPasswordPropia() {
  return useMutation({
    mutationFn: (datos: CambioPasswordRequest) => api.patch<void>('/api/auth/me/password', datos),
  });
}
