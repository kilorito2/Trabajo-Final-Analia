import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAreas, useCambiarEstadoArea, useGuardarArea } from '../../api/areas';
import { mensajeDeError } from '../../api/errores';
import { exportarAreas } from '../../api/reportes';
import type { Area } from '../../api/tipos';
import { useSesion } from '../../auth/SesionProvider';
import { BotonesExportar } from '../../components/BotonesExportar';
import { useAvisos } from '../../components/Avisos';
import { CampoBusqueda } from '../../components/CampoBusqueda';
import { CampoFormulario } from '../../components/CampoFormulario';
import { CasillaInactivos, filtroActivo } from '../../components/CasillaInactivos';
import { Confirmacion } from '../../components/Confirmacion';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { InsigniaActivo } from '../../components/InsigniaActivo';
import { Modal } from '../../components/Modal';
import { Paginador } from '../../components/Paginador';
import { Tabla, type Columna } from '../../components/Tabla';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { useFormulario } from '../../hooks/useFormulario';
import { combinar, longitudEntre, obligatorio } from '../../utils/validaciones';

const validaciones = { nombre: combinar(obligatorio, longitudEntre(1, 100)) };

function FormularioArea({ area, alCerrar }: { area: Area | null; alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const guardar = useGuardarArea();
  const formulario = useFormulario({ nombre: area?.nombre ?? '' }, validaciones);

  function enviar() {
    if (!formulario.validarTodo()) return;
    guardar.mutate(
      { id: area?.id, datos: { nombre: formulario.valores.nombre.trim() } },
      {
        onSuccess: (guardada) => {
          avisar(
            'exito',
            area ? `Se actualizó el área ${guardada.nombre}.` : `Se creó el área ${guardada.nombre}.`,
          );
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo={area ? 'Editar área' : 'Nueva área'}
      alCerrar={alCerrar}
      bloqueado={guardar.isPending}
      pie={
        <>
          <button type="button" className="boton" onClick={alCerrar} disabled={guardar.isPending}>
            Cancelar
          </button>
          <button
            type="submit"
            form="formulario-area"
            className="boton boton--primario"
            disabled={guardar.isPending}
          >
            {guardar.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form
        id="formulario-area"
        className="formulario"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        {formulario.errorGeneral && (
          <p className="mensaje mensaje--peligro" role="alert">
            {formulario.errorGeneral}
          </p>
        )}
        <CampoFormulario etiqueta="Nombre" obligatorio error={formulario.errores.nombre}>
          {(props) => <input {...props} className="control" {...formulario.registrar('nombre')} />}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

export function PaginaAreas() {
  const filtros = useFiltrosUrl();
  const { puede } = useSesion();
  const { avisar } = useAvisos();
  const puedeEditar = puede('CATALOGO_EDITAR');
  const [editando, setEditando] = useState<Area | 'nueva' | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState<Area | null>(null);
  const cambiarEstado = useCambiarEstadoArea();

  const filtrosApi = { q: filtros.leer('q') || undefined, activo: filtroActivo(filtros) };
  const consulta = useAreas({
    ...filtrosApi,
    page: filtros.pagina,
    sort: filtros.ordenApi,
  });

  const columnas: Columna<Area>[] = [
    { clave: 'nombre', encabezado: 'Nombre', celda: (a) => a.nombre, campoOrden: 'nombre' },
    { clave: 'estado', encabezado: 'Estado', celda: (a) => <InsigniaActivo activo={a.activo} femenino /> },
  ];
  if (puedeEditar) {
    columnas.push({
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      celda: (a) => (
        <div className="tabla__acciones">
          <button type="button" className="boton boton--chico boton--texto" onClick={() => setEditando(a)}>
            Editar<span className="solo-lectores"> {a.nombre}</span>
          </button>
          <button
            type="button"
            className="boton boton--chico boton--texto"
            onClick={() => {
              cambiarEstado.reset();
              setCambiandoEstado(a);
            }}
          >
            {a.activo ? 'Dar de baja' : 'Reactivar'}
            <span className="solo-lectores"> {a.nombre}</span>
          </button>
        </div>
      ),
    });
  }

  function confirmarEstado() {
    if (!cambiandoEstado) return;
    const activo = !cambiandoEstado.activo;
    cambiarEstado.mutate(
      { id: cambiandoEstado.id, activo },
      {
        onSuccess: () => {
          avisar('exito', `${activo ? 'Se reactivó' : 'Se dio de baja'} el área ${cambiandoEstado.nombre}.`);
          setCambiandoEstado(null);
        },
      },
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Áreas"
        acciones={
          <>
            <BotonesExportar que="las áreas" exportar={(formato) => exportarAreas(filtrosApi, formato)} />
            {puedeEditar && (
              <button type="button" className="boton boton--primario" onClick={() => setEditando('nueva')}>
                <Plus size={16} aria-hidden="true" />
                Nueva área
              </button>
            )}
          </>
        }
      />
      <div className="filtros">
        <CampoBusqueda etiqueta="Buscar por nombre" />
        <CasillaInactivos texto="Incluir inactivas" />
      </div>
      <Tabla
        titulo="Áreas"
        columnas={columnas}
        filas={consulta.data?.content}
        claveFila={(a) => a.id}
        cargando={consulta.isPending}
        error={consulta.error}
        alReintentar={() => consulta.refetch()}
        vacio="No hay áreas que coincidan con la búsqueda."
        orden={filtros.orden ?? { campo: 'nombre', direccion: 'asc' }}
        alOrdenar={filtros.ordenar}
      />
      {consulta.data && <Paginador pagina={consulta.data.page} alCambiar={filtros.irAPagina} />}

      {editando && (
        <FormularioArea area={editando === 'nueva' ? null : editando} alCerrar={() => setEditando(null)} />
      )}
      <Confirmacion
        abierto={cambiandoEstado !== null}
        titulo={cambiandoEstado?.activo ? 'Dar de baja el área' : 'Reactivar el área'}
        textoConfirmar={cambiandoEstado?.activo ? 'Dar de baja' : 'Reactivar'}
        peligro={cambiandoEstado?.activo}
        procesando={cambiarEstado.isPending}
        error={cambiarEstado.error ? mensajeDeError(cambiarEstado.error) : null}
        alConfirmar={confirmarEstado}
        alCancelar={() => setCambiandoEstado(null)}
      >
        <p>
          {cambiandoEstado?.activo
            ? `¿Dar de baja el área ${cambiandoEstado.nombre}? No va a poder recibir transferencias nuevas.`
            : `¿Reactivar el área ${cambiandoEstado?.nombre}?`}
        </p>
      </Confirmacion>
    </>
  );
}
