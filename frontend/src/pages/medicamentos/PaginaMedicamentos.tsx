import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { useMedicamentos } from '../../api/medicamentos';
import type { EstadoStock, Medicamento } from '../../api/tipos';
import { useSesion } from '../../auth/SesionProvider';
import { exportarMedicamentos } from '../../api/reportes';
import { BotonesExportar } from '../../components/BotonesExportar';
import { CampoBusqueda } from '../../components/CampoBusqueda';
import { CasillaInactivos, filtroActivo } from '../../components/CasillaInactivos';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Insignia } from '../../components/Insignia';
import { Paginador } from '../../components/Paginador';
import { Tabla, type Columna } from '../../components/Tabla';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { describirEstadoStock } from '../../utils/estadoStock';
import { formatearFecha } from '../../utils/fechas';
import { formatearNumero } from '../../utils/numeros';

const OPCIONES_ESTADO: { valor: EstadoStock; texto: string }[] = [
  { valor: 'SIN_STOCK', texto: 'Sin stock' },
  { valor: 'STOCK_BAJO', texto: 'Stock bajo' },
  { valor: 'OK', texto: 'OK' },
];

function leerEstado(valor: string): EstadoStock | undefined {
  return OPCIONES_ESTADO.find((opcion) => opcion.valor === valor)?.valor;
}

const columnas: Columna<Medicamento>[] = [
  { clave: 'codigo', encabezado: 'Código', celda: (m) => m.codigo, campoOrden: 'codigo' },
  {
    clave: 'nombre',
    encabezado: 'Nombre',
    campoOrden: 'nombre',
    celda: (m) => (
      <>
        <Link to={`/medicamentos/${m.id}`}>{m.nombre}</Link>
        {!m.activo && <span className="texto-suave texto-sm"> (inactivo)</span>}
      </>
    ),
  },
  { clave: 'presentacion', encabezado: 'Presentación', celda: (m) => m.presentacion },
  {
    clave: 'stockTotal',
    encabezado: 'Stock total',
    numero: true,
    campoOrden: 'stockTotal',
    celda: (m) => formatearNumero(m.stockTotal),
  },
  {
    clave: 'stockMinimo',
    encabezado: 'Stock mínimo',
    numero: true,
    celda: (m) => formatearNumero(m.stockMinimo),
  },
  {
    clave: 'proximoVencimiento',
    encabezado: 'Próximo vencimiento',
    campoOrden: 'proximoVencimiento',
    sinCortar: true,
    celda: (m) => formatearFecha(m.proximoVencimiento),
  },
  {
    clave: 'estado',
    encabezado: 'Estado',
    celda: (m) => <Insignia {...describirEstadoStock(m.estadoStock)} />,
  },
];

export function PaginaMedicamentos() {
  const filtros = useFiltrosUrl();
  const { puede } = useSesion();
  const estado = leerEstado(filtros.leer('estado'));

  const filtrosApi = { q: filtros.leer('q') || undefined, estado, activo: filtroActivo(filtros) };
  const consulta = useMedicamentos({
    ...filtrosApi,
    page: filtros.pagina,
    sort: filtros.ordenApi,
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Medicamentos"
        acciones={
          <>
            <BotonesExportar
              que="el stock de medicamentos"
              exportar={(formato) => exportarMedicamentos(filtrosApi, formato)}
            />
            {puede('CATALOGO_EDITAR') && (
              <Link to="/medicamentos/nuevo" className="boton boton--primario">
                <Plus size={16} aria-hidden="true" />
                Nuevo medicamento
              </Link>
            )}
          </>
        }
      />
      <div className="filtros">
        <CampoBusqueda etiqueta="Buscar por código o nombre" />
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-estado">
            Estado
          </label>
          <select
            id="filtro-estado"
            className="control"
            value={estado ?? ''}
            onChange={(e) => filtros.actualizar({ estado: e.target.value || null })}
          >
            <option value="">Todos</option>
            {OPCIONES_ESTADO.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </select>
        </div>
        <CasillaInactivos />
      </div>
      <Tabla
        titulo="Medicamentos"
        columnas={columnas}
        filas={consulta.data?.content}
        claveFila={(m) => m.id}
        cargando={consulta.isPending}
        error={consulta.error}
        alReintentar={() => consulta.refetch()}
        vacio="No hay medicamentos que coincidan con los filtros."
        orden={filtros.orden ?? { campo: 'nombre', direccion: 'asc' }}
        alOrdenar={filtros.ordenar}
      />
      {consulta.data && <Paginador pagina={consulta.data.page} alCambiar={filtros.irAPagina} />}
    </>
  );
}
