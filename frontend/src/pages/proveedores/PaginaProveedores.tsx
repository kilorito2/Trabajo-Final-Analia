import { useState } from 'react';
import { Plus } from 'lucide-react';
import { mensajeDeError } from '../../api/errores';
import { useCambiarEstadoProveedor, useGuardarProveedor, useProveedores } from '../../api/proveedores';
import type { Proveedor } from '../../api/tipos';
import { useSesion } from '../../auth/SesionProvider';
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
import { aplicarMascaraCuit } from '../../utils/cuit';
import { formatearNumero } from '../../utils/numeros';
import { combinar, cuit, email, longitudEntre, obligatorio } from '../../utils/validaciones';

const validaciones = {
  razonSocial: combinar(obligatorio, longitudEntre(1, 150)),
  cuit: combinar(obligatorio, cuit),
  email,
};

function FormularioProveedor({ proveedor, alCerrar }: { proveedor: Proveedor | null; alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const guardar = useGuardarProveedor();
  const formulario = useFormulario(
    {
      razonSocial: proveedor?.razonSocial ?? '',
      cuit: proveedor ? aplicarMascaraCuit(proveedor.cuit) : '',
      telefono: proveedor?.telefono ?? '',
      email: proveedor?.email ?? '',
    },
    validaciones,
  );

  function enviar() {
    if (!formulario.validarTodo()) return;
    const { razonSocial, cuit: cuitIngresado, telefono, email: correo } = formulario.valores;
    guardar.mutate(
      {
        id: proveedor?.id,
        datos: {
          razonSocial: razonSocial.trim(),
          cuit: cuitIngresado,
          telefono: telefono.trim() || null,
          email: correo.trim() || null,
        },
      },
      {
        onSuccess: (guardado) => {
          avisar('exito', `Se guardó el proveedor ${guardado.razonSocial}.`);
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
      alCerrar={alCerrar}
      bloqueado={guardar.isPending}
      pie={
        <>
          <button type="button" className="boton" onClick={alCerrar} disabled={guardar.isPending}>
            Cancelar
          </button>
          <button
            type="submit"
            form="formulario-proveedor"
            className="boton boton--primario"
            disabled={guardar.isPending}
          >
            {guardar.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form
        id="formulario-proveedor"
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
        <CampoFormulario etiqueta="Razón social" obligatorio error={formulario.errores.razonSocial}>
          {(props) => <input {...props} className="control" {...formulario.registrar('razonSocial')} />}
        </CampoFormulario>
        <CampoFormulario
          etiqueta="CUIT"
          obligatorio
          ayuda="Formato XX-XXXXXXXX-X."
          error={formulario.errores.cuit}
        >
          {(props) => (
            <input
              {...props}
              className="control"
              inputMode="numeric"
              value={formulario.valores.cuit}
              onChange={(e) => formulario.cambiar('cuit', aplicarMascaraCuit(e.target.value))}
              onBlur={() => formulario.alSalir('cuit')}
            />
          )}
        </CampoFormulario>
        <CampoFormulario etiqueta="Teléfono" error={formulario.errores.telefono}>
          {(props) => (
            <input {...props} className="control" type="tel" {...formulario.registrar('telefono')} />
          )}
        </CampoFormulario>
        <CampoFormulario etiqueta="Email" error={formulario.errores.email}>
          {(props) => (
            <input {...props} className="control" type="email" {...formulario.registrar('email')} />
          )}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

export function PaginaProveedores() {
  const filtros = useFiltrosUrl();
  const { puede } = useSesion();
  const { avisar } = useAvisos();
  const puedeEditar = puede('CATALOGO_EDITAR');
  const [editando, setEditando] = useState<Proveedor | 'nuevo' | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState<Proveedor | null>(null);
  const cambiarEstado = useCambiarEstadoProveedor();

  const consulta = useProveedores({
    q: filtros.leer('q') || undefined,
    activo: filtroActivo(filtros),
    page: filtros.pagina,
    sort: filtros.ordenApi,
  });

  const columnas: Columna<Proveedor>[] = [
    {
      clave: 'razonSocial',
      encabezado: 'Razón social',
      celda: (p) => p.razonSocial,
      campoOrden: 'razonSocial',
    },
    { clave: 'cuit', encabezado: 'CUIT', celda: (p) => aplicarMascaraCuit(p.cuit) },
    { clave: 'telefono', encabezado: 'Teléfono', celda: (p) => p.telefono ?? '—' },
    { clave: 'email', encabezado: 'Email', celda: (p) => p.email ?? '—' },
    {
      clave: 'lotes',
      encabezado: 'Lotes con stock',
      numero: true,
      celda: (p) => formatearNumero(p.lotesConStock),
    },
    { clave: 'estado', encabezado: 'Estado', celda: (p) => <InsigniaActivo activo={p.activo} /> },
  ];
  if (puedeEditar) {
    columnas.push({
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      celda: (p) => (
        <div className="tabla__acciones">
          <button type="button" className="boton boton--chico boton--texto" onClick={() => setEditando(p)}>
            Editar<span className="solo-lectores"> {p.razonSocial}</span>
          </button>
          <button
            type="button"
            className="boton boton--chico boton--texto"
            onClick={() => {
              cambiarEstado.reset();
              setCambiandoEstado(p);
            }}
          >
            {p.activo ? 'Dar de baja' : 'Reactivar'}
            <span className="solo-lectores"> {p.razonSocial}</span>
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
          avisar(
            'exito',
            `${activo ? 'Se reactivó' : 'Se dio de baja'} el proveedor ${cambiandoEstado.razonSocial}.`,
          );
          setCambiandoEstado(null);
        },
      },
    );
  }

  const lotesConStock = cambiandoEstado?.lotesConStock ?? 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Proveedores"
        acciones={
          puedeEditar && (
            <button type="button" className="boton boton--primario" onClick={() => setEditando('nuevo')}>
              <Plus size={16} aria-hidden="true" />
              Nuevo proveedor
            </button>
          )
        }
      />
      <div className="filtros">
        <CampoBusqueda etiqueta="Buscar por razón social o CUIT" />
        <CasillaInactivos />
      </div>
      <Tabla
        titulo="Proveedores"
        columnas={columnas}
        filas={consulta.data?.content}
        claveFila={(p) => p.id}
        cargando={consulta.isPending}
        error={consulta.error}
        alReintentar={() => consulta.refetch()}
        vacio="No hay proveedores que coincidan con la búsqueda."
        orden={filtros.orden ?? { campo: 'razonSocial', direccion: 'asc' }}
        alOrdenar={filtros.ordenar}
      />
      {consulta.data && <Paginador pagina={consulta.data.page} alCambiar={filtros.irAPagina} />}

      {editando && (
        <FormularioProveedor
          proveedor={editando === 'nuevo' ? null : editando}
          alCerrar={() => setEditando(null)}
        />
      )}
      <Confirmacion
        abierto={cambiandoEstado !== null}
        titulo={cambiandoEstado?.activo ? 'Dar de baja el proveedor' : 'Reactivar el proveedor'}
        textoConfirmar={cambiandoEstado?.activo ? 'Dar de baja' : 'Reactivar'}
        peligro={cambiandoEstado?.activo}
        procesando={cambiarEstado.isPending}
        error={cambiarEstado.error ? mensajeDeError(cambiarEstado.error) : null}
        alConfirmar={confirmarEstado}
        alCancelar={() => setCambiandoEstado(null)}
      >
        {cambiandoEstado?.activo ? (
          <>
            <p>¿Dar de baja a {cambiandoEstado.razonSocial}?</p>
            {lotesConStock > 0 && (
              <p className="mensaje mensaje--aviso">
                Tiene {formatearNumero(lotesConStock)} {lotesConStock === 1 ? 'lote' : 'lotes'} con stock. Van
                a seguir disponibles, pero no vas a poder elegir este proveedor en ingresos nuevos.
              </p>
            )}
          </>
        ) : (
          <p>¿Reactivar a {cambiandoEstado?.razonSocial}?</p>
        )}
      </Confirmacion>
    </>
  );
}
