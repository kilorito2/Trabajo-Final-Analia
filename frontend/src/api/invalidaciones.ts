import type { QueryClient } from '@tanstack/react-query';

/** Cualquier cambio de stock (ingreso, transferencia, baja o ajuste) afecta a todas estas vistas. */
export function invalidarStock(queryClient: QueryClient): Promise<void> {
  return Promise.all(
    ['medicamentos', 'lotes', 'movimientos', 'alertas', 'resumen', 'transferencias', 'proveedores'].map(
      (clave) => queryClient.invalidateQueries({ queryKey: [clave] }),
    ),
  ).then(() => undefined);
}
