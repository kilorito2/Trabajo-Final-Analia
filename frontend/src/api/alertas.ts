import { useQuery } from '@tanstack/react-query';
import { api } from './cliente';
import type { Alertas, Resumen } from './tipos';

export function useAlertas() {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: ({ signal }) => api.get<Alertas>('/api/alertas', undefined, signal),
  });
}

export function useResumen() {
  return useQuery({
    queryKey: ['resumen'],
    queryFn: ({ signal }) => api.get<Resumen>('/api/resumen', undefined, signal),
  });
}
