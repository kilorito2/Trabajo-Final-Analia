import type { Rol } from '../api/tipos';

const NOMBRES_ROL = {
  ADMIN: 'Administrador',
  FARMACEUTICO: 'Farmacéutico',
  CONSULTA: 'Consulta',
} as const satisfies Record<Rol, string>;

export const ROLES = Object.keys(NOMBRES_ROL) as Rol[];

export function nombreRol(rol: Rol): string {
  return NOMBRES_ROL[rol];
}
