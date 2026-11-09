import { useState, type SelectHTMLAttributes } from 'react';
import { Plus } from 'lucide-react';
import { mensajeDeError } from '../../api/errores';
import type { Rol, Usuario } from '../../api/tipos';
import {
  useCambiarEstadoUsuario,
  useCrearUsuario,
  useEditarUsuario,
  useRestablecerPassword,
  useUsuarios,
} from '../../api/usuarios';
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
import { formatearFechaHora } from '../../utils/fechas';
import { ROLES, nombreRol } from '../../utils/roles';
import { combinar, longitudEntre, obligatorio } from '../../utils/validaciones';

const validarPassword = combinar(obligatorio, longitudEntre(8, 72));
const validarRol = (valor: string) => (valor ? null : 'Elegí un rol.');
const esRol = (valor: string): valor is Rol => ROLES.some((rol) => rol === valor);

function SelectorRol(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className="control">
      <option value="">Elegí un rol</option>
      {ROLES.map((rol) => (
        <option key={rol} value={rol}>
          {nombreRol(rol)}
        </option>
      ))}
    </select>
  );
}

function PieFormulario({
  formularioId,
  pendiente,
  alCerrar,
}: {
  formularioId: string;
  pendiente: boolean;
  alCerrar: () => void;
}) {
  return (
    <>
      <button type="button" className="boton" onClick={alCerrar} disabled={pendiente}>
        Cancelar
      </button>
      <button type="submit" form={formularioId} className="boton boton--primario" disabled={pendiente}>
        {pendiente ? 'Guardando…' : 'Guardar'}
      </button>
    </>
  );
}

function ModalAlta({ alCerrar }: { alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const crear = useCrearUsuario();
  const formulario = useFormulario(
    { username: '', nombreCompleto: '', rol: '', password: '', repetir: '' },
    {
      username: combinar(obligatorio, longitudEntre(3, 50)),
      nombreCompleto: combinar(obligatorio, longitudEntre(1, 100)),
      rol: validarRol,
      password: validarPassword,
      repetir: (valor: string, valores: { password: string }) =>
        valor === valores.password ? null : 'Las contraseñas no coinciden.',
    },
  );

  function enviar() {
    const { username, nombreCompleto, rol, password } = formulario.valores;
    if (!formulario.validarTodo() || !esRol(rol)) return;
    crear.mutate(
      { username: username.trim(), nombreCompleto: nombreCompleto.trim(), rol, password },
      {
        onSuccess: (creado) => {
          avisar('exito', `Se creó el usuario ${creado.username}.`);
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo="Nuevo usuario"
      alCerrar={alCerrar}
      bloqueado={crear.isPending}
      pie={
        <PieFormulario formularioId="formulario-usuario" pendiente={crear.isPending} alCerrar={alCerrar} />
      }
    >
      <form
        id="formulario-usuario"
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
        <CampoFormulario
          etiqueta="Usuario"
          obligatorio
          ayuda="Se guarda en minúsculas."
          error={formulario.errores.username}
        >
          {(props) => (
            <input {...props} className="control" autoComplete="off" {...formulario.registrar('username')} />
          )}
        </CampoFormulario>
        <CampoFormulario etiqueta="Nombre completo" obligatorio error={formulario.errores.nombreCompleto}>
          {(props) => <input {...props} className="control" {...formulario.registrar('nombreCompleto')} />}
        </CampoFormulario>
        <CampoFormulario etiqueta="Rol" obligatorio error={formulario.errores.rol}>
          {(props) => <SelectorRol {...props} {...formulario.registrar('rol')} />}
        </CampoFormulario>
        <CampoFormulario
          etiqueta="Contraseña inicial"
          obligatorio
          ayuda="De 8 a 72 caracteres."
          error={formulario.errores.password}
        >
          {(props) => (
            <input
              {...props}
              className="control"
              type="password"
              autoComplete="new-password"
              {...formulario.registrar('password')}
            />
          )}
        </CampoFormulario>
        <CampoFormulario etiqueta="Repetir contraseña" obligatorio error={formulario.errores.repetir}>
          {(props) => (
            <input
              {...props}
              className="control"
              type="password"
              autoComplete="new-password"
              {...formulario.registrar('repetir')}
            />
          )}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

function ModalEdicion({ usuario, alCerrar }: { usuario: Usuario; alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const editar = useEditarUsuario();
  const formulario = useFormulario(
    { nombreCompleto: usuario.nombreCompleto, rol: String(usuario.rol) },
    { nombreCompleto: combinar(obligatorio, longitudEntre(1, 100)), rol: validarRol },
  );

  function enviar() {
    const { nombreCompleto, rol } = formulario.valores;
    if (!formulario.validarTodo() || !esRol(rol)) return;
    editar.mutate(
      { id: usuario.id, datos: { nombreCompleto: nombreCompleto.trim(), rol } },
      {
        onSuccess: () => {
          avisar('exito', `Se actualizó el usuario ${usuario.username}.`);
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo={`Editar a ${usuario.username}`}
      alCerrar={alCerrar}
      bloqueado={editar.isPending}
      pie={
        <PieFormulario formularioId="formulario-edicion" pendiente={editar.isPending} alCerrar={alCerrar} />
      }
    >
      <form
        id="formulario-edicion"
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
        <CampoFormulario etiqueta="Nombre completo" obligatorio error={formulario.errores.nombreCompleto}>
          {(props) => <input {...props} className="control" {...formulario.registrar('nombreCompleto')} />}
        </CampoFormulario>
        <CampoFormulario etiqueta="Rol" obligatorio error={formulario.errores.rol}>
          {(props) => <SelectorRol {...props} {...formulario.registrar('rol')} />}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

function ModalPassword({ usuario, alCerrar }: { usuario: Usuario; alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const restablecer = useRestablecerPassword();
  const formulario = useFormulario(
    { password: '', repetir: '' },
    {
      password: validarPassword,
      repetir: (valor: string, valores: { password: string }) =>
        valor === valores.password ? null : 'Las contraseñas no coinciden.',
    },
  );

  function enviar() {
    if (!formulario.validarTodo()) return;
    restablecer.mutate(
      { id: usuario.id, passwordNueva: formulario.valores.password },
      {
        onSuccess: () => {
          avisar('exito', `Se restableció la contraseña de ${usuario.username}.`);
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo={`Restablecer la contraseña de ${usuario.username}`}
      alCerrar={alCerrar}
      bloqueado={restablecer.isPending}
      pie={
        <PieFormulario
          formularioId="formulario-password"
          pendiente={restablecer.isPending}
          alCerrar={alCerrar}
        />
      }
    >
      <form
        id="formulario-password"
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
        <CampoFormulario
          etiqueta="Contraseña nueva"
          obligatorio
          ayuda="De 8 a 72 caracteres."
          error={formulario.errores.password}
        >
          {(props) => (
            <input
              {...props}
              className="control"
              type="password"
              autoComplete="new-password"
              {...formulario.registrar('password')}
            />
          )}
        </CampoFormulario>
        <CampoFormulario etiqueta="Repetir contraseña" obligatorio error={formulario.errores.repetir}>
          {(props) => (
            <input
              {...props}
              className="control"
              type="password"
              autoComplete="new-password"
              {...formulario.registrar('repetir')}
            />
          )}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

type Accion = { tipo: 'alta' } | { tipo: 'editar' | 'password' | 'estado'; usuario: Usuario };

export function PaginaUsuarios() {
  const filtros = useFiltrosUrl();
  const { usuario: actual } = useSesion();
  const { avisar } = useAvisos();
  const [accion, setAccion] = useState<Accion | null>(null);
  const cambiarEstado = useCambiarEstadoUsuario();

  const consulta = useUsuarios({
    q: filtros.leer('q') || undefined,
    activo: filtroActivo(filtros),
    page: filtros.pagina,
    sort: filtros.ordenApi,
  });

  const columnas: Columna<Usuario>[] = [
    { clave: 'username', encabezado: 'Usuario', campoOrden: 'username', celda: (u) => u.username },
    { clave: 'nombre', encabezado: 'Nombre', campoOrden: 'nombreCompleto', celda: (u) => u.nombreCompleto },
    { clave: 'rol', encabezado: 'Rol', celda: (u) => nombreRol(u.rol) },
    { clave: 'estado', encabezado: 'Estado', celda: (u) => <InsigniaActivo activo={u.activo} /> },
    {
      clave: 'alta',
      encabezado: 'Fecha de alta',
      campoOrden: 'creadoEn',
      celda: (u) => formatearFechaHora(u.creadoEn),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      celda: (u) => (
        <div className="tabla__acciones">
          <button
            type="button"
            className="boton boton--chico boton--texto"
            onClick={() => setAccion({ tipo: 'editar', usuario: u })}
          >
            Editar<span className="solo-lectores"> a {u.username}</span>
          </button>
          <button
            type="button"
            className="boton boton--chico boton--texto"
            onClick={() => setAccion({ tipo: 'password', usuario: u })}
          >
            Restablecer contraseña<span className="solo-lectores"> de {u.username}</span>
          </button>
          {/* No se ofrece desactivarse a uno mismo; el backend igual lo impide. */}
          {u.id !== actual?.id && (
            <button
              type="button"
              className="boton boton--chico boton--texto"
              onClick={() => {
                cambiarEstado.reset();
                setAccion({ tipo: 'estado', usuario: u });
              }}
            >
              {u.activo ? 'Desactivar' : 'Activar'}
              <span className="solo-lectores"> a {u.username}</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const cerrar = () => setAccion(null);
  const enEstado = accion?.tipo === 'estado' ? accion.usuario : null;

  function confirmarEstado() {
    if (!enEstado) return;
    const activo = !enEstado.activo;
    cambiarEstado.mutate(
      { id: enEstado.id, activo },
      {
        onSuccess: () => {
          avisar('exito', `Se ${activo ? 'activó' : 'desactivó'} el usuario ${enEstado.username}.`);
          cerrar();
        },
      },
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        acciones={
          <button type="button" className="boton boton--primario" onClick={() => setAccion({ tipo: 'alta' })}>
            <Plus size={16} aria-hidden="true" />
            Nuevo usuario
          </button>
        }
      />
      <div className="filtros">
        <CampoBusqueda etiqueta="Buscar por usuario o nombre" />
        <CasillaInactivos />
      </div>
      <Tabla
        titulo="Usuarios"
        columnas={columnas}
        filas={consulta.data?.content}
        claveFila={(u) => u.id}
        cargando={consulta.isPending}
        error={consulta.error}
        alReintentar={() => consulta.refetch()}
        vacio="No hay usuarios que coincidan con la búsqueda."
        orden={filtros.orden ?? { campo: 'username', direccion: 'asc' }}
        alOrdenar={filtros.ordenar}
      />
      {consulta.data && <Paginador pagina={consulta.data.page} alCambiar={filtros.irAPagina} />}

      {accion?.tipo === 'alta' && <ModalAlta alCerrar={cerrar} />}
      {accion?.tipo === 'editar' && <ModalEdicion usuario={accion.usuario} alCerrar={cerrar} />}
      {accion?.tipo === 'password' && <ModalPassword usuario={accion.usuario} alCerrar={cerrar} />}
      <Confirmacion
        abierto={enEstado !== null}
        titulo={enEstado?.activo ? 'Desactivar el usuario' : 'Activar el usuario'}
        textoConfirmar={enEstado?.activo ? 'Desactivar' : 'Activar'}
        peligro={enEstado?.activo}
        procesando={cambiarEstado.isPending}
        error={cambiarEstado.error ? mensajeDeError(cambiarEstado.error) : null}
        alConfirmar={confirmarEstado}
        alCancelar={cerrar}
      >
        <p>
          {enEstado?.activo
            ? `¿Desactivar a ${enEstado.username}? No va a poder ingresar al sistema.`
            : `¿Activar a ${enEstado?.username}?`}
        </p>
      </Confirmacion>
    </>
  );
}
