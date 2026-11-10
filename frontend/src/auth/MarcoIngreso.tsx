import type { ReactNode } from 'react';
import { BellRing, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Marca } from '../components/Logo';

/** Pantallas sin sesión (ingreso y recuperación): presentación a la izquierda, formulario a la derecha. */
export function MarcoIngreso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="ingreso">
      <title>{`${titulo} · Farmacia`}</title>
      <section className="ingreso__presentacion" aria-label="Presentación">
        <Marca subtitulo="Hospital público" />
        <div className="ingreso__mensaje">
          <p className="ingreso__titular">Control de stock de la farmacia del hospital</p>
          <p>Medicamentos, lotes y vencimientos en un solo lugar, con trazabilidad de cada unidad.</p>
        </div>
        <ul className="ingreso__puntos">
          <li>
            <ClipboardCheck size={20} aria-hidden="true" />
            Transferencias a las áreas por orden de vencimiento
          </li>
          <li>
            <BellRing size={20} aria-hidden="true" />
            Alertas de lotes por vencer y de stock bajo
          </li>
          <li>
            <ShieldCheck size={20} aria-hidden="true" />
            Acceso por roles y registro de cada movimiento
          </li>
        </ul>
      </section>
      <div className="ingreso__lado-formulario">{children}</div>
    </main>
  );
}
