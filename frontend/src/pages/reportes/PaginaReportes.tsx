import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ArrowRightLeft,
  CalendarClock,
  Eye,
  FileSpreadsheet,
  FileText,
  Pill,
  type LucideIcon,
} from 'lucide-react';
import { useAreas } from '../../api/areas';
import { exportarLotes, exportarMedicamentos, exportarTransferencias } from '../../api/reportes';
import type { EstadoLote, EstadoStock, FormatoReporte } from '../../api/tipos';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { useDescarga } from '../../hooks/useDescarga';
import { diasEntre, hoy, sumarDias } from '../../utils/fechas';

const MAXIMO_DIAS_TRANSFERENCIAS = 366;

const ESTADOS_STOCK: { valor: EstadoStock; texto: string }[] = [
  { valor: 'SIN_STOCK', texto: 'Sin stock' },
  { valor: 'STOCK_BAJO', texto: 'Stock bajo' },
  { valor: 'OK', texto: 'OK' },
];

// Cada opción indica qué estados pide al backend y a qué vista de "Lotes" lleva.
const VISTAS_LOTES = {
  alertas: { texto: 'Vencidos y por vencer', estados: ['VENCIDO', 'POR_VENCER'], vista: 'todos' },
  vencidos: { texto: 'Solo vencidos', estados: ['VENCIDO'], vista: 'vencidos' },
  'por-vencer': { texto: 'Solo por vencer', estados: ['POR_VENCER'], vista: 'por-vencer' },
  todos: { texto: 'Todos con stock', estados: ['VIGENTE', 'POR_VENCER', 'VENCIDO'], vista: 'todos' },
} as const satisfies Record<string, { texto: string; estados: readonly EstadoLote[]; vista: string }>;

type VistaLotes = keyof typeof VISTAS_LOTES;

type PropsReporte = {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  enPantalla: string;
  problema?: string | null;
  enCurso: string | null;
  alExportar: (formato: FormatoReporte) => void;
  children: ReactNode;
};

function TarjetaReporte({
  icono: Icono,
  titulo,
  descripcion,
  enPantalla,
  problema,
  enCurso,
  alExportar,
  children,
}: PropsReporte) {
  const idTitulo = useId();
  const idProblema = useId();
  const deshabilitado = Boolean(problema) || enCurso !== null;
  return (
    <section className="reporte tarjeta" aria-labelledby={idTitulo}>
      <header className="reporte__encabezado">
        <span className="reporte__icono" aria-hidden="true">
          <Icono size={22} />
        </span>
        <div>
          <h2 id={idTitulo}>{titulo}</h2>
          <p className="texto-suave">{descripcion}</p>
        </div>
      </header>
      <div className="reporte__filtros">{children}</div>
      {problema && (
        <p id={idProblema} className="mensaje mensaje--aviso">
          {problema}
        </p>
      )}
      <div className="reporte__acciones">
        <Link to={enPantalla} className="boton boton--texto">
          <Eye size={16} aria-hidden="true" />
          Ver en pantalla
        </Link>
        <div className="reporte__descargas">
          <button
            type="button"
            className="boton"
            disabled={deshabilitado}
            aria-describedby={problema ? idProblema : undefined}
            onClick={() => alExportar('CSV')}
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            {enCurso === 'CSV' ? 'Descargando…' : 'Excel (CSV)'}
          </button>
          <button
            type="button"
            className="boton boton--primario"
            disabled={deshabilitado}
            aria-describedby={problema ? idProblema : undefined}
            onClick={() => alExportar('PDF')}
          >
            <FileText size={16} aria-hidden="true" />
            {enCurso === 'PDF' ? 'Descargando…' : 'PDF'}
          </button>
        </div>
      </div>
    </section>
  );
}

function ReporteStock() {
  const descarga = useDescarga();
  const [estado, setEstado] = useState<EstadoStock | ''>('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const id = useId();

  const enPantalla = new URLSearchParams();
  if (estado) enPantalla.set('estado', estado);
  if (incluirInactivos) enPantalla.set('inactivos', 'si');

  return (
    <TarjetaReporte
      icono={Pill}
      titulo="Stock de medicamentos"
      descripcion="Stock disponible, mínimo, próximo vencimiento y estado de cada medicamento."
      enPantalla={`/medicamentos?${enPantalla.toString()}`}
      enCurso={descarga.enCurso}
      alExportar={(formato) =>
        void descarga.descargar(formato, () =>
          exportarMedicamentos(
            { estado: estado || undefined, activo: incluirInactivos ? undefined : true },
            formato,
          ),
        )
      }
    >
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`${id}-estado`}>
          Estado
        </label>
        <select
          id={`${id}-estado`}
          className="control"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoStock | '')}
        >
          <option value="">Todos</option>
          {ESTADOS_STOCK.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      </div>
      <label className="casilla">
        <input
          type="checkbox"
          checked={incluirInactivos}
          onChange={(e) => setIncluirInactivos(e.target.checked)}
        />
        Incluir inactivos
      </label>
    </TarjetaReporte>
  );
}

function ReporteLotes() {
  const descarga = useDescarga();
  const [vista, setVista] = useState<VistaLotes>('alertas');
  const id = useId();
  const elegida = VISTAS_LOTES[vista];

  return (
    <TarjetaReporte
      icono={CalendarClock}
      titulo="Lotes y vencimientos"
      descripcion="Lotes con su vencimiento, días restantes, cantidad y proveedor, ordenados por fecha."
      enPantalla={`/lotes?vista=${elegida.vista}`}
      enCurso={descarga.enCurso}
      alExportar={(formato) =>
        void descarga.descargar(formato, () => exportarLotes({ estado: [...elegida.estados] }, formato))
      }
    >
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`${id}-vista`}>
          Lotes
        </label>
        <select
          id={`${id}-vista`}
          className="control"
          value={vista}
          onChange={(e) => setVista(e.target.value as VistaLotes)}
        >
          {Object.entries(VISTAS_LOTES).map(([clave, opcion]) => (
            <option key={clave} value={clave}>
              {opcion.texto}
            </option>
          ))}
        </select>
      </div>
    </TarjetaReporte>
  );
}

function ReporteTransferencias() {
  const descarga = useDescarga();
  const areas = useAreas({ size: 100, sort: 'nombre,asc' });
  const [desde, setDesde] = useState(() => sumarDias(hoy(), -30));
  const [hasta, setHasta] = useState(() => hoy());
  const [areaId, setAreaId] = useState('');
  const id = useId();

  let problema: string | null = null;
  if (!desde || !hasta) problema = 'Completá las dos fechas.';
  else if (desde > hasta) problema = 'La fecha "desde" no puede ser posterior a "hasta".';
  else if (diasEntre(desde, hasta) > MAXIMO_DIAS_TRANSFERENCIAS) {
    problema = `El rango puede ser de hasta ${MAXIMO_DIAS_TRANSFERENCIAS} días.`;
  }

  const enPantalla = new URLSearchParams({ desde, hasta });
  if (areaId) enPantalla.set('area', areaId);

  return (
    <TarjetaReporte
      icono={ArrowRightLeft}
      titulo="Transferencias a áreas"
      descripcion="Cada medicamento entregado: número, fecha, área, lote, vencimiento y cantidad."
      enPantalla={`/transferencias?${enPantalla.toString()}`}
      problema={problema}
      enCurso={descarga.enCurso}
      alExportar={(formato) => {
        if (problema) return;
        void descarga.descargar(formato, () =>
          exportarTransferencias({ desde, hasta, areaId: Number(areaId) || undefined }, formato),
        );
      }}
    >
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`${id}-desde`}>
          Desde
        </label>
        <input
          id={`${id}-desde`}
          className="control"
          type="date"
          value={desde}
          max={hasta}
          onChange={(e) => setDesde(e.target.value)}
        />
      </div>
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`${id}-hasta`}>
          Hasta
        </label>
        <input
          id={`${id}-hasta`}
          className="control"
          type="date"
          value={hasta}
          min={desde}
          onChange={(e) => setHasta(e.target.value)}
        />
      </div>
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`${id}-area`}>
          Área
        </label>
        <select
          id={`${id}-area`}
          className="control"
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
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
    </TarjetaReporte>
  );
}

export function PaginaReportes() {
  return (
    <>
      <EncabezadoPagina titulo="Reportes" />
      <p className="texto-suave reportes__intro">
        Elegí los filtros y descargá el reporte en Excel (CSV) o PDF. Siempre incluye todo lo filtrado, no
        solo lo que se ve en una página.
      </p>
      <div className="reportes">
        <ReporteStock />
        <ReporteLotes />
        <ReporteTransferencias />
      </div>
    </>
  );
}
