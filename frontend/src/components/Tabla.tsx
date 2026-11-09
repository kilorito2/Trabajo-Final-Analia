import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ErrorCarga, Vacio } from './Estados';

type Direccion = 'asc' | 'desc';
export type Orden = { campo: string; direccion: Direccion };

export type Columna<F> = {
  clave: string;
  encabezado: string;
  celda: (fila: F) => ReactNode;
  numero?: boolean;
  /** Campo de `sort` que acepta el backend. Solo las columnas con este dato se pueden ordenar. */
  campoOrden?: string;
  /** Fechas, números de comprobante y textos cortos que no conviene partir en dos renglones. */
  sinCortar?: boolean;
  /** Para encabezados de columnas de acciones, que no muestran texto. */
  encabezadoOculto?: boolean;
};

type PropsTabla<F> = {
  titulo: string;
  columnas: Columna<F>[];
  filas: F[] | undefined;
  claveFila: (fila: F) => string | number;
  cargando: boolean;
  error: unknown;
  alReintentar: () => void;
  vacio: ReactNode;
  orden?: Orden | null;
  alOrdenar?: (orden: Orden) => void;
  filasEsqueleto?: number;
};

function clasesCelda(columna: { numero?: boolean; sinCortar?: boolean }): string | undefined {
  const clases = [columna.numero && 'numero', columna.sinCortar && 'sin-cortar'].filter(Boolean);
  return clases.length > 0 ? clases.join(' ') : undefined;
}

function valorAriaSort(columna: { campoOrden?: string }, orden: Orden | null | undefined) {
  if (!columna.campoOrden) return undefined;
  if (orden?.campo !== columna.campoOrden) return 'none';
  return orden.direccion === 'asc' ? 'ascending' : 'descending';
}

function IconoOrden({ activo, direccion }: { activo: boolean; direccion?: Direccion }) {
  if (!activo) return <ArrowUpDown size={14} aria-hidden="true" />;
  return direccion === 'asc' ? (
    <ArrowUp size={14} aria-hidden="true" />
  ) : (
    <ArrowDown size={14} aria-hidden="true" />
  );
}

export function Tabla<F>({
  titulo,
  columnas,
  filas,
  claveFila,
  cargando,
  error,
  alReintentar,
  vacio,
  orden,
  alOrdenar,
  filasEsqueleto = 8,
}: PropsTabla<F>) {
  if (error && !cargando) {
    return (
      <div className="tabla-contenedor">
        <ErrorCarga error={error} alReintentar={alReintentar} />
      </div>
    );
  }

  if (!cargando && filas?.length === 0) {
    return (
      <div className="tabla-contenedor">
        <Vacio>{vacio}</Vacio>
      </div>
    );
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla" aria-busy={cargando}>
        <caption className="solo-lectores">{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((columna) => {
              const activo = orden?.campo === columna.campoOrden;
              const clases = columna.numero ? 'numero' : undefined;
              return (
                <th
                  key={columna.clave}
                  scope="col"
                  className={clases}
                  aria-sort={valorAriaSort(columna, orden)}
                >
                  {columna.encabezadoOculto ? (
                    <span className="solo-lectores">{columna.encabezado}</span>
                  ) : columna.campoOrden && alOrdenar ? (
                    <button
                      type="button"
                      className="tabla__orden"
                      onClick={() =>
                        alOrdenar({
                          campo: columna.campoOrden ?? columna.clave,
                          direccion: activo && orden?.direccion === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      {columna.encabezado}
                      <IconoOrden activo={activo} direccion={orden?.direccion} />
                    </button>
                  ) : (
                    columna.encabezado
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {cargando || !filas
            ? Array.from({ length: filasEsqueleto }, (_, i) => (
                <tr key={`esqueleto-${i}`} aria-hidden="true">
                  {columnas.map((columna) => (
                    <td key={columna.clave}>
                      <span className="tabla__esqueleto" />
                    </td>
                  ))}
                </tr>
              ))
            : filas.map((fila) => (
                <tr key={claveFila(fila)}>
                  {columnas.map((columna) => (
                    <td key={columna.clave} className={clasesCelda(columna)}>
                      {columna.celda(fila)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
