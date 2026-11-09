import { esCuitValido } from './cuit';

/** Un validador devuelve el mensaje de error, o null si el valor es válido. */
export type Validador<T> = (valor: T) => string | null;

export function obligatorio(valor: string): string | null {
  return valor.trim() === '' ? 'Completá este campo.' : null;
}

export function longitudEntre(minimo: number, maximo: number): Validador<string> {
  return (valor) => {
    const largo = valor.trim().length;
    if (largo < minimo) return `Tiene que tener al menos ${minimo} caracteres.`;
    if (largo > maximo) return `Puede tener hasta ${maximo} caracteres.`;
    return null;
  };
}

export function entero(opciones: { minimo?: number; maximo?: number } = {}): Validador<string> {
  return (valor) => {
    if (!/^\d+$/.test(valor.trim())) return 'Ingresá un número entero.';
    const numero = Number(valor);
    if (opciones.minimo !== undefined && numero < opciones.minimo) {
      return opciones.minimo === 1
        ? 'Tiene que ser mayor que 0.'
        : `Tiene que ser al menos ${opciones.minimo}.`;
    }
    if (opciones.maximo !== undefined && numero > opciones.maximo) {
      return `No puede superar ${opciones.maximo}.`;
    }
    return null;
  };
}

export function email(valor: string): string | null {
  if (valor.trim() === '') return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim()) ? null : 'Ingresá un email válido.';
}

export function cuit(valor: string): string | null {
  return esCuitValido(valor) ? null : 'El CUIT no es válido. Revisá los números.';
}

/** Aplica validadores en orden y devuelve el primer error. */
export function combinar<T>(...validadores: Validador<T>[]): Validador<T> {
  return (valor) => {
    for (const validar of validadores) {
      const error = validar(valor);
      if (error) return error;
    }
    return null;
  };
}
