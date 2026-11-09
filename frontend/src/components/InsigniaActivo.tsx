import { Insignia } from './Insignia';

/** "Activo"/"Inactivo" (o en femenino, para áreas). */
export function InsigniaActivo({ activo, femenino = false }: { activo: boolean; femenino?: boolean }) {
  const texto = activo ? (femenino ? 'Activa' : 'Activo') : femenino ? 'Inactiva' : 'Inactivo';
  return <Insignia texto={texto} tono={activo ? 'ok' : 'neutro'} />;
}
