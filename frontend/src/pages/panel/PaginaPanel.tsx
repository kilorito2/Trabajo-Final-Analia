import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { CalendarClock, OctagonAlert, PackageX, TrendingDown, type LucideIcon } from 'lucide-react';
import { useAlertas, useResumen } from '../../api/alertas';
import type { AlertaLote, AlertaMedicamento, Resumen } from '../../api/tipos';
import { exportarAlertas } from '../../api/reportes';
import { BotonesExportar } from '../../components/BotonesExportar';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { Insignia } from '../../components/Insignia';
import type { Tono } from '../../utils/estadoStock';
import { describirDiasParaVencer, formatearFecha, formatearFechaHora } from '../../utils/fechas';
import { formatearNumero } from '../../utils/numeros';

const MAXIMO_POR_GRUPO = 10;

type Indicador = {
  clave: keyof Resumen['totales'];
  etiqueta: string;
  tono: Tono;
  enlace: string;
  icono: LucideIcon;
};

function indicadores(diasPorVencer: number): Indicador[] {
  return [
    {
      clave: 'vencidos',
      etiqueta: 'Lotes vencidos',
      tono: 'peligro',
      enlace: '/lotes?estado=VENCIDO',
      icono: OctagonAlert,
    },
    {
      clave: 'sinStock',
      etiqueta: 'Sin stock',
      tono: 'peligro',
      enlace: '/medicamentos?estado=SIN_STOCK',
      icono: PackageX,
    },
    {
      clave: 'porVencer',
      etiqueta: `Por vencer (${diasPorVencer} días)`,
      tono: 'aviso',
      enlace: '/lotes?estado=POR_VENCER',
      icono: CalendarClock,
    },
    {
      clave: 'stockBajo',
      etiqueta: 'Stock bajo',
      tono: 'aviso',
      enlace: '/medicamentos?estado=STOCK_BAJO',
      icono: TrendingDown,
    },
  ];
}

function GrupoAlertas<T>({
  titulo,
  tono,
  insignia,
  elementos,
  enlaceTodos,
  clave,
  renglon,
}: {
  titulo: string;
  tono: Tono;
  insignia: string;
  elementos: T[];
  enlaceTodos: string;
  clave: (elemento: T) => number;
  renglon: (elemento: T) => ReactNode;
}) {
  const idTitulo = useId();
  if (elementos.length === 0) return null;
  return (
    <section className="grupo-alertas" aria-labelledby={idTitulo}>
      <h3 id={idTitulo}>
        <Insignia texto={insignia} tono={tono} /> {titulo} ({formatearNumero(elementos.length)})
      </h3>
      <ul className="lista-alertas">
        {elementos.slice(0, MAXIMO_POR_GRUPO).map((elemento) => (
          <li key={clave(elemento)}>{renglon(elemento)}</li>
        ))}
      </ul>
      {elementos.length > MAXIMO_POR_GRUPO && (
        <Link to={enlaceTodos}>
          Ver todos<span className="solo-lectores"> ({titulo.toLowerCase()})</span>
        </Link>
      )}
    </section>
  );
}

const renglonLote = (a: AlertaLote) => (
  <>
    <Link to={`/medicamentos/${a.medicamentoId}`}>{a.medicamento}</Link>
    <span className="texto-suave">
      {' '}
      · Lote {a.numeroLote} · {formatearFecha(a.fechaVencimiento)} ·{' '}
      {describirDiasParaVencer(a.diasParaVencer)} · {formatearNumero(a.cantidadActual)} u.
    </span>
  </>
);

const renglonMedicamento = (a: AlertaMedicamento) => (
  <>
    <Link to={`/medicamentos/${a.medicamentoId}`}>
      {a.nombre} {a.presentacion}
    </Link>
    <span className="texto-suave">
      {' '}
      · Stock {formatearNumero(a.stockTotal)} (mínimo {formatearNumero(a.stockMinimo)})
    </span>
  </>
);

export function PaginaPanel() {
  const resumen = useResumen();
  const alertas = useAlertas();

  return (
    <>
      <EncabezadoPagina
        titulo="Panel"
        acciones={<BotonesExportar que="las alertas" exportar={exportarAlertas} />}
      />
      {resumen.isPending && <Cargando />}
      {resumen.isError && <ErrorCarga error={resumen.error} alReintentar={() => resumen.refetch()} />}
      {resumen.data && (
        <>
          <ul className="indicadores">
            {indicadores(resumen.data.diasPorVencer).map((indicador) => (
              <li key={indicador.clave}>
                <Link to={indicador.enlace} className={`indicador indicador--${indicador.tono}`}>
                  <span className="indicador__icono">
                    <indicador.icono size={20} aria-hidden="true" />
                  </span>
                  <span className="indicador__numero">
                    {formatearNumero(resumen.data.totales[indicador.clave])}
                  </span>
                  <span className="indicador__etiqueta">{indicador.etiqueta}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="panel">
            <section className="tarjeta tarjeta--relleno panel__alertas" aria-labelledby="titulo-alertas">
              <h2 id="titulo-alertas">Alertas</h2>
              {alertas.isPending && <Cargando />}
              {alertas.isError && <ErrorCarga error={alertas.error} alReintentar={() => alertas.refetch()} />}
              {alertas.data &&
                (alertas.data.vencidos.length +
                  alertas.data.sinStock.length +
                  alertas.data.porVencer.length +
                  alertas.data.stockBajo.length ===
                0 ? (
                  <p className="texto-suave">No hay alertas. El stock y los vencimientos están en orden.</p>
                ) : (
                  <>
                    <GrupoAlertas
                      titulo="Lotes vencidos"
                      insignia="Vencido"
                      tono="peligro"
                      elementos={alertas.data.vencidos}
                      enlaceTodos="/lotes?estado=VENCIDO"
                      clave={(a) => a.loteId}
                      renglon={renglonLote}
                    />
                    <GrupoAlertas
                      titulo="Medicamentos sin stock"
                      insignia="Sin stock"
                      tono="peligro"
                      elementos={alertas.data.sinStock}
                      enlaceTodos="/medicamentos?estado=SIN_STOCK"
                      clave={(a) => a.medicamentoId}
                      renglon={renglonMedicamento}
                    />
                    <GrupoAlertas
                      titulo="Lotes por vencer"
                      insignia="Por vencer"
                      tono="aviso"
                      elementos={alertas.data.porVencer}
                      enlaceTodos="/lotes?estado=POR_VENCER"
                      clave={(a) => a.loteId}
                      renglon={renglonLote}
                    />
                    <GrupoAlertas
                      titulo="Medicamentos con stock bajo"
                      insignia="Stock bajo"
                      tono="aviso"
                      elementos={alertas.data.stockBajo}
                      enlaceTodos="/medicamentos?estado=STOCK_BAJO"
                      clave={(a) => a.medicamentoId}
                      renglon={renglonMedicamento}
                    />
                  </>
                ))}
            </section>

            <div className="panel__lateral">
              <section className="tarjeta tarjeta--relleno" aria-labelledby="titulo-ultimas">
                <h2 id="titulo-ultimas">Últimas transferencias</h2>
                {resumen.data.ultimasTransferencias.length === 0 ? (
                  <p className="texto-suave">Todavía no hay transferencias.</p>
                ) : (
                  <table className="tabla tabla--compacta">
                    <caption className="solo-lectores">Últimas 5 transferencias</caption>
                    <thead>
                      <tr>
                        <th scope="col">Número</th>
                        <th scope="col">Fecha</th>
                        <th scope="col">Área</th>
                        <th scope="col" className="numero">
                          Unidades
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.data.ultimasTransferencias.map((t) => (
                        <tr key={t.id}>
                          <td className="sin-cortar">
                            <Link to={`/transferencias/${t.id}`}>{t.numero}</Link>
                          </td>
                          <td className="sin-cortar">{formatearFechaHora(t.fechaHora)}</td>
                          <td>{t.area}</td>
                          <td className="numero">{formatearNumero(t.unidadesTotales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <EgresosPorArea egresos={resumen.data.egresosPorArea} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function EgresosPorArea({ egresos }: { egresos: Resumen['egresosPorArea'] }) {
  const maximo = Math.max(...egresos.map((e) => e.unidades), 1);
  return (
    <section className="tarjeta tarjeta--relleno" aria-labelledby="titulo-egresos">
      <h2 id="titulo-egresos">Unidades transferidas por área (últimos 30 días)</h2>
      {egresos.length === 0 ? (
        <p className="texto-suave">No hubo transferencias en los últimos 30 días.</p>
      ) : (
        <table className="tabla tabla--compacta">
          <caption className="solo-lectores">Unidades transferidas por área en los últimos 30 días</caption>
          <thead>
            <tr>
              <th scope="col">Área</th>
              <th scope="col" className="numero">
                Unidades
              </th>
              <th scope="col">
                <span className="solo-lectores">Proporción</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {egresos.map((e) => (
              <tr key={e.areaId}>
                <td>{e.area}</td>
                <td className="numero">{formatearNumero(e.unidades)}</td>
                <td className="barra-celda">
                  {/* Decorativa: el número ya está escrito. style se aplica por CSSOM, que la CSP permite. */}
                  <span
                    className="barra"
                    aria-hidden="true"
                    style={{ width: `${(e.unidades / maximo) * 100}%` }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
