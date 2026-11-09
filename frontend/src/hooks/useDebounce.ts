import { useEffect, useState } from 'react';

/** Devuelve `valor` recién cuando dejó de cambiar durante `esperaMs`. */
export function useDebounce<T>(valor: T, esperaMs = 300): T {
  const [demorado, setDemorado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDemorado(valor), esperaMs);
    return () => clearTimeout(temporizador);
  }, [valor, esperaMs]);

  return demorado;
}
