import { useState } from 'react';
import { Link } from 'react-router';
import { Download, Plus } from 'lucide-react';
import { useAreas } from '../../api/areas';
import { mensajeDeError } from '../../api/errores';
import { exportarTransferencias, useTransferencias } from '../../api/transferencias';
import type { TransferenciaResumen } from '../../api/tipos';
import { useSesion } from '../../auth/SesionProvider';
import { useAvisos } from '../../components/Avisos';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Paginador } from '../../components/Paginador';
import { Tabla, type Columna } from '../../components/Tabla';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { diasEntre, formatearFechaHora, hoy, sumarDias } from '../../utils/fechas';
import { formatearNumero } from '../../utils/numeros';

const MAXIMO_DIAS_EXPORTACION = 366;
const DIAS_POR_DEFECTO = 30;

const columnas: Columna<TransferenciaResumen>[] = [
  {
    clave: 'numero',
    encabezado: 'Número',
    sinCortar: true,
    // Un enlace real (no un onClick en la fila) para poder abrirlo con teclado.
    celda: (t) => <Link to={`/transferencias/${t.id}`}>{t.numero}</Link>,
  },
  {
    clave: 'fecha',
    encabezado: 'Fecha y hora',
    campoOrden: 'fechaHora',
    sinCortar: true,
    celda: (t) => formatearFechaHora(t.fechaHora),
  },
  { clave: 'area', encabezado: 'Área', celda: (t) => t.area },
  { clave: 'usuario', encabezado: 'Usuario', celda: (t) => t.realizadaPor },
  { clave: 'items', encabezado: 'Ítems', numero: true, celda: (t) => formatearNumero(t.cantidadItems) },
  {
    clave: 'unidades',
    encabezado: 'Unidades',
    numero: true,
    celda: (t) => formatearNumero(t.unidadesTotales),
  },
];

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function PaginaTransferencias() {
  const filtros = useFiltrosUrl();
  const { puede } = useSesion();
  const { avisar } = useAvisos();
  const areas = useAreas({ size: 100, sort: 'nombre,asc' });
  const [exportando, setExportando] = useState(false);

  const desde = filtros.leer('desde', sumarDias(hoy(), -DIAS_POR_DEFECTO));
  const hasta = filtros.leer('hasta', hoy());
  const areaId = Number(filtros.leer('area')) || undefined;
  const fechasValidas = FECHA.test(desde) && FECHA.test(hasta) && desde <= hasta;

  const consulta = useTransferencias({
    desde: FECHA.test(desde) ? desde : undefined,
    hasta: FECHA.test(hasta) ? hasta : undefined,
    areaId,
    page: filtros.pagina,
    sort: filtros.ordenApi ?? 'fechaHora,desc',
  });

  let problemaExportacion: string | null = null;
  if (!FECHA.test(desde) || !FECHA.test(hasta))
    problemaExportacion = 'Para exportar, completá las dos fechas.';
  else if (desde > hasta) problemaExportacion = 'La fecha "desde" no puede ser posterior a "hasta".';
  else if (diasEntre(desde, hasta) > MAXIMO_DIAS_EXPORTACION) {
    problemaExportacion = `Para exportar, el rango puede ser de hasta ${MAXIMO_DIAS_EXPORTACION} días.`;
  }

  async function exportar() {
    if (problemaExportacion || exportando) return;
    setExportando(true);
    try {
      await exportarTransferencias({ desde, hasta, areaId });
    } catch (error) {
      avisar('error', mensajeDeError(error));
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Transferencias"
        acciones={
          <>
            <button
              type="button"
              className="boton"
              onClick={exportar}
              disabled={Boolean(problemaExportacion) || exportando}
              aria-describedby={problemaExportacion ? 'problema-exportacion' : undefined}
            >
              <Download size={16} aria-hidden="true" />
              {exportando ? 'Exportando…' : 'Exportar a Excel'}
            </button>
            {puede('TRANSFERENCIA_CREAR') && (
              <Link to="/transferencias/nueva" className="boton boton--primario">
                <Plus size={16} aria-hidden="true" />
                Nueva transferencia
              </Link>
            )}
          </>
        }
      />
      <div className="filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-desde">
            Desde
          </label>
          <input
            id="filtro-desde"
            className="control"
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => filtros.actualizar({ desde: e.target.value })}
          />
        </div>
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-hasta">
            Hasta
          </label>
          <input
            id="filtro-hasta"
            className="control"
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => filtros.actualizar({ hasta: e.target.value })}
          />
        </div>
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-area">
            Área
          </label>
          <select
            id="filtro-area"
            className="control"
            value={areaId ?? ''}
            onChange={(e) => filtros.actualizar({ area: e.target.value || null })}
          >
            <option value="">Todas</option>
            {areas.data?.content.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
                {a.activo ? '' : ' (inactiva)'}
              </option>
            ))}
          </select>
        </div>
      </div>
      {problemaExportacion && (
        <p id="problema-exportacion" className="mensaje mensaje--aviso filtros__aviso">
          {problemaExportacion}
        </p>
      )}
      <Tabla
        titulo="Transferencias"
        columnas={columnas}
        filas={fechasValidas ? consulta.data?.content : []}
        claveFila={(t) => t.id}
        cargando={fechasValidas && consulta.isPending}
        error={consulta.error}
        alReintentar={() => consulta.refetch()}
        vacio="No hay transferencias en ese período."
        orden={filtros.orden ?? { campo: 'fechaHora', direccion: 'desc' }}
        alOrdenar={filtros.ordenar}
      />
      {fechasValidas && consulta.data && (
        <Paginador pagina={consulta.data.page} alCambiar={filtros.irAPagina} />
      )}
    </>
  );
}
