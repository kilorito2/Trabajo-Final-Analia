import { MutationCache, QueryClient } from '@tanstack/react-query';
import { ErrorApi } from './errores';

/** Reintenta una sola vez y solo ante caídas de red o errores 5xx; nunca ante un 4xx. */
export function debeReintentar(intentosFallidos: number, error: unknown): boolean {
  return intentosFallidos < 1 && error instanceof ErrorApi && error.esTransitorio;
}

/**
 * `avisarError` muestra un aviso cuando una acción falla por red, tiempo o servidor.
 * Los 400/409 los muestra cada formulario junto a sus campos, y el 403 lo avisa el cliente.
 */
export function crearQueryClient(avisarError: (mensaje: string) => void): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: debeReintentar,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ErrorApi && (error.tipo !== 'http' || error.status >= 500)) {
          avisarError(error.message);
        }
      },
    }),
  });
}
