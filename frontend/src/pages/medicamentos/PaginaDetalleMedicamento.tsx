import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { PackagePlus, Pencil } from 'lucide-react';
import { mensajeDeError } from '../../api/errores';
import { useMovimientos } from '../../api/lotes';
import { useCambiarEstadoMedicamento, useMedicamento } from '../../api/medicamentos';
import type { Lote, Movimiento, TipoMovimiento } from '../../api/tipos';
import { useSesion } from '../../auth/SesionProvider';
import { useAvisos } from '../../components/Avisos';
import { Confirmacion } from '../../components/Confirmacion';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { Insignia } from '../../components/Insignia';
import { InsigniaActivo } from '../../components/InsigniaActivo';
import { Paginador } from '../../components/Paginador';
import { Tabla, type Columna } from '../../components/Tabla';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { describirEstadoLote, describirEstadoStock } from '../../utils/estadoStock';
import { formatearFecha, formatearFechaHora } from '../../utils/fechas';
import { nombreCompleto } from '../../utils/medicamento';
import { formatearNumero, formatearVariacion } from '../../utils/numeros';

const TIPOS_MOVIMIENTO = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  BAJA_VENCIMIENTO: 'Baja por vencimiento',
  AJUSTE: 'Ajuste',
} as const satisfies Record<TipoMovimiento, string>;

const columnasLotes: Columna<Lote>[] = [
  { clave: 'numero', encabezado: 'Lote', celda: (l) => l.numeroLote },
  { clave: 'proveedor', encabezado: 'Proveedor', celda: (l) => l.proveedor },
  { clave: 'vencimiento', encabezado: 'Vencimiento', celda: (l) => formatearFecha(l.fechaVencimiento) },
  {
    clave: 'cantidad',
    encabezado: 'Cantidad actual',
    numero: true,
    celda: (l) => formatearNumero(l.cantidadActual),
  },
  { clave: 'estado', encabezado: 'Estado', celda: (l) => <Insignia {...describirEstadoLote(l.estado)} /> },
];

const columnasMovimientos: Columna<Movimiento>[] = [
  { clave: 'fecha', encabezado: 'Fecha', sinCortar: true, celda: (m) => formatearFechaHora(m.fechaHora) },
  { clave: 'tipo', encabezado: 'Tipo', celda: (m) => TIPOS_MOVIMIENTO[m.tipo] },
  { clave: 'lote', encabezado: 'Lote', celda: (m) => m.numeroLote },
  { clave: 'cantidad', encabezado: 'Cantidad', numero: true, celda: (m) => formatearVariacion(m.cantidad) },
  {
    clave: 'saldo',
    encabezado: 'Saldo del lote',
    numero: true,
    celda: (m) => formatearNumero(m.saldoResultante),
  },
  { clave: 'usuario', encabezado: 'Usuario', celda: (m) => m.usuario },
  {
    clave: 'detalle',
    encabezado: 'Motivo o transferencia',
    celda: (m) =>
      m.transferenciaId !== null ? (
        <Link to={`/transferencias/${m.transferenciaId}`}>Ver transferencia</Link>
      ) : (
        (m.motivo ?? '—')
      ),
  },
];

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function PaginaDetalleMedicamento() {
  const id = Number(useParams().id);
  const filtros = useFiltrosUrl();
  const { puede } = useSesion();
  const { avisar } = useAvisos();
  const consulta = useMedicamento(id);
  const movimientos = useMovimientos({ medicamentoId: id, page: filtros.pagina, sort: 'fechaHora,desc' });
  const cambiarEstado = useCambiarEstadoMedicamento();
  const [confirmando, setConfirmando] = useState(false);

  if (consulta.isPending) return <Cargando />;
  if (consulta.isError) return <ErrorCarga error={consulta.error} alReintentar={() => consulta.refetch()} />;

  const medicamento = consulta.data;
  const nombre = nombreCompleto(medicamento);

  function confirmarEstado() {
    const activo = !medicamento.activo;
    cambiarEstado.mutate(
      { id: medicamento.id, activo },
      {
        onSuccess: () => {
          avisar('exito', `${activo ? 'Se reactivó' : 'Se dio de baja'} ${nombre}.`);
          setConfirmando(false);
        },
      },
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo={nombre}
        acciones={
          <>
            {puede('STOCK_INGRESAR') && medicamento.activo && (
              <Link to={`/ingresos/nuevo?medicamentoId=${medicamento.id}`} className="boton boton--primario">
                <PackagePlus size={16} aria-hidden="true" />
                Registrar ingreso
              </Link>
            )}
            {puede('CATALOGO_EDITAR') && (
              <>
                <Link to={`/medicamentos/${medicamento.id}/editar`} className="boton">
                  <Pencil size={16} aria-hidden="true" />
                  Editar
                </Link>
                <button
                  type="button"
                  className="boton"
                  onClick={() => {
                    cambiarEstado.reset();
                    setConfirmando(true);
                  }}
                >
                  {medicamento.activo ? 'Dar de baja' : 'Reactivar'}
                </button>
              </>
            )}
          </>
        }
      />

      <dl className="datos tarjeta tarjeta--relleno">
        <Dato etiqueta="Código">{medicamento.codigo}</Dato>
        <Dato etiqueta="Presentación">{medicamento.presentacion}</Dato>
        <Dato etiqueta="Stock total">
          <span className="numero">{formatearNumero(medicamento.stockTotal)}</span>
        </Dato>
        <Dato etiqueta="Stock mínimo">
          <span className="numero">{formatearNumero(medicamento.stockMinimo)}</span>
        </Dato>
        <Dato etiqueta="Próximo vencimiento">{formatearFecha(medicamento.proximoVencimiento)}</Dato>
        <Dato etiqueta="Estado de stock">
          <Insignia {...describirEstadoStock(medicamento.estadoStock)} />
        </Dato>
        <Dato etiqueta="Estado">
          <InsigniaActivo activo={medicamento.activo} />
        </Dato>
      </dl>

      <section className="seccion" aria-labelledby="titulo-lotes">
        <h2 id="titulo-lotes">Lotes con stock</h2>
        <Tabla
          titulo="Lotes con stock, del que vence primero al último"
          columnas={columnasLotes}
          filas={medicamento.lotes}
          claveFila={(l) => l.id}
          cargando={false}
          error={null}
          alReintentar={() => consulta.refetch()}
          vacio="No hay lotes con stock de este medicamento."
        />
      </section>

      <section className="seccion" aria-labelledby="titulo-movimientos">
        <h2 id="titulo-movimientos">Movimientos</h2>
        <Tabla
          titulo="Movimientos de stock, del más reciente al más antiguo"
          columnas={columnasMovimientos}
          filas={movimientos.data?.content}
          claveFila={(m) => m.id}
          cargando={movimientos.isPending}
          error={movimientos.error}
          alReintentar={() => movimientos.refetch()}
          vacio="Todavía no hay movimientos de este medicamento."
        />
        {movimientos.data && <Paginador pagina={movimientos.data.page} alCambiar={filtros.irAPagina} />}
      </section>

      <Confirmacion
        abierto={confirmando}
        titulo={medicamento.activo ? 'Dar de baja el medicamento' : 'Reactivar el medicamento'}
        textoConfirmar={medicamento.activo ? 'Dar de baja' : 'Reactivar'}
        peligro={medicamento.activo}
        procesando={cambiarEstado.isPending}
        error={cambiarEstado.error ? mensajeDeError(cambiarEstado.error) : null}
        alConfirmar={confirmarEstado}
        alCancelar={() => setConfirmando(false)}
      >
        <p>
          {medicamento.activo
            ? `¿Dar de baja ${nombre}? No se va a poder elegir en ingresos ni transferencias nuevas.`
            : `¿Reactivar ${nombre}?`}
        </p>
      </Confirmacion>
    </>
  );
}
