import { Link, useParams } from 'react-router';
import { FileDown, Printer } from 'lucide-react';
import { descargarComprobante } from '../../api/reportes';
import { useTransferencia } from '../../api/transferencias';
import { useSesion } from '../../auth/SesionProvider';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { useDescarga } from '../../hooks/useDescarga';
import { formatearFecha, formatearFechaHora } from '../../utils/fechas';
import { formatearNumero } from '../../utils/numeros';

export function PaginaComprobante() {
  const id = Number(useParams().id);
  const { puede } = useSesion();
  const consulta = useTransferencia(id);
  const descarga = useDescarga();

  if (consulta.isPending) return <Cargando />;
  if (consulta.isError) return <ErrorCarga error={consulta.error} alReintentar={() => consulta.refetch()} />;

  const t = consulta.data;
  const unidades = t.detalle.reduce((total, d) => total + d.cantidad, 0);

  return (
    <>
      <div className="no-imprimir">
        <EncabezadoPagina
          titulo={`Transferencia ${t.numero}`}
          acciones={
            <>
              <button type="button" className="boton boton--primario" onClick={() => window.print()}>
                <Printer size={16} aria-hidden="true" />
                Imprimir
              </button>
              <button
                type="button"
                className="boton"
                disabled={descarga.enCurso !== null}
                onClick={() => void descarga.descargar('PDF', () => descargarComprobante(id))}
              >
                <FileDown size={16} aria-hidden="true" />
                {descarga.enCurso ? 'Descargando…' : 'Descargar PDF'}
              </button>
              {puede('TRANSFERENCIA_CREAR') && (
                <Link to="/transferencias/nueva" className="boton">
                  Nueva transferencia
                </Link>
              )}
              <Link to="/transferencias" className="boton">
                Ver historial
              </Link>
            </>
          }
        />
      </div>

      <article className="comprobante tarjeta tarjeta--relleno" aria-labelledby="titulo-comprobante">
        <header className="comprobante__encabezado">
          <div>
            <p className="texto-suave texto-sm">Farmacia del hospital · Comprobante de transferencia</p>
            <h2 id="titulo-comprobante">{t.numero}</h2>
          </div>
          <p className="comprobante__fecha">{formatearFechaHora(t.fechaHora)}</p>
        </header>

        <dl className="datos">
          <div className="dato">
            <dt>Área de destino</dt>
            <dd>{t.area.nombre}</dd>
          </div>
          <div className="dato">
            <dt>Entregó</dt>
            <dd>{t.realizadaPor.nombreCompleto}</dd>
          </div>
          <div className="dato">
            <dt>Unidades</dt>
            <dd>{formatearNumero(unidades)}</dd>
          </div>
        </dl>

        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Detalle por lote</caption>
            <thead>
              <tr>
                <th scope="col">Medicamento</th>
                <th scope="col">Lote</th>
                <th scope="col">Vencimiento</th>
                <th scope="col" className="numero">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody>
              {t.detalle.map((d) => (
                <tr key={d.loteId}>
                  <td>{d.medicamento}</td>
                  <td>{d.numeroLote}</td>
                  <td>{formatearFecha(d.fechaVencimiento)}</td>
                  <td className="numero">{formatearNumero(d.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {t.observaciones && (
          <p className="comprobante__observaciones">
            <strong>Observaciones:</strong> {t.observaciones}
          </p>
        )}

        <div className="comprobante__firmas">
          <div className="firma">Entrega (farmacia): firma y aclaración</div>
          <div className="firma">Recibe ({t.area.nombre}): firma y aclaración</div>
        </div>
      </article>
    </>
  );
}
