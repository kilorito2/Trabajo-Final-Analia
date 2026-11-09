// El borrador de la transferencia se guarda en sessionStorage mientras se carga: si la
// sesión vence o el backend responde 409, no se pierde lo que se había cargado.

export type Linea = {
  medicamentoId: number;
  nombre: string;
  /** Stock disponible conocido (se actualiza si el backend informa faltantes). */
  stock: number;
  /** Texto del input; se valida antes de enviar. */
  cantidad: string;
};

export type Borrador = { areaId: string; lineas: Linea[]; observaciones: string };

const CLAVE = 'farmacia.borrador-transferencia';

export const BORRADOR_VACIO: Borrador = { areaId: '', lineas: [], observaciones: '' };

function esLinea(valor: unknown): valor is Linea {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'medicamentoId' in valor &&
    'nombre' in valor &&
    'stock' in valor &&
    'cantidad' in valor &&
    typeof valor.medicamentoId === 'number' &&
    typeof valor.nombre === 'string' &&
    typeof valor.stock === 'number' &&
    typeof valor.cantidad === 'string'
  );
}

export function leerBorrador(): Borrador {
  try {
    const valor: unknown = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
    if (
      typeof valor === 'object' &&
      valor !== null &&
      'areaId' in valor &&
      'lineas' in valor &&
      'observaciones' in valor &&
      typeof valor.areaId === 'string' &&
      typeof valor.observaciones === 'string' &&
      Array.isArray(valor.lineas)
    ) {
      return {
        areaId: valor.areaId,
        observaciones: valor.observaciones,
        lineas: valor.lineas.filter(esLinea),
      };
    }
  } catch {
    // Un borrador ilegible se descarta.
  }
  return BORRADOR_VACIO;
}

export function guardarBorrador(borrador: Borrador): void {
  const vacio = !borrador.areaId && borrador.lineas.length === 0 && !borrador.observaciones;
  if (vacio) sessionStorage.removeItem(CLAVE);
  else sessionStorage.setItem(CLAVE, JSON.stringify(borrador));
}

export function borrarBorrador(): void {
  sessionStorage.removeItem(CLAVE);
}
