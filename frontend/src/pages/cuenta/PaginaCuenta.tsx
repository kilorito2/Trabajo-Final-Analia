import { useCambiarPasswordPropia } from '../../api/auth';
import { useSesion } from '../../auth/SesionProvider';
import { useAvisos } from '../../components/Avisos';
import { CampoFormulario } from '../../components/CampoFormulario';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { useFormulario } from '../../hooks/useFormulario';
import { nombreRol } from '../../utils/roles';
import { combinar, longitudEntre, obligatorio } from '../../utils/validaciones';

const VACIO = { passwordActual: '', passwordNueva: '', repetir: '' };

const validaciones = {
  passwordActual: obligatorio,
  passwordNueva: combinar(obligatorio, longitudEntre(8, 72)),
  repetir: (valor: string, valores: typeof VACIO) =>
    valor === valores.passwordNueva ? null : 'Las contraseñas no coinciden.',
};

export function PaginaCuenta() {
  const { usuario } = useSesion();
  const { avisar } = useAvisos();
  const cambiar = useCambiarPasswordPropia();
  const formulario = useFormulario(VACIO, validaciones);

  function enviar() {
    if (!formulario.validarTodo()) return;
    cambiar.mutate(
      { passwordActual: formulario.valores.passwordActual, passwordNueva: formulario.valores.passwordNueva },
      {
        onSuccess: () => {
          avisar('exito', 'Se cambió tu contraseña.');
          formulario.reiniciar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  if (!usuario) return null;

  return (
    <>
      <EncabezadoPagina titulo="Mi cuenta" />
      <dl className="datos tarjeta tarjeta--relleno datos--cuenta">
        <div className="dato">
          <dt>Usuario</dt>
          <dd>{usuario.username}</dd>
        </div>
        <div className="dato">
          <dt>Nombre</dt>
          <dd>{usuario.nombreCompleto}</dd>
        </div>
        <div className="dato">
          <dt>Rol</dt>
          <dd>{nombreRol(usuario.rol)}</dd>
        </div>
      </dl>

      <section className="seccion" aria-labelledby="titulo-password">
        <h2 id="titulo-password">Cambiar la contraseña</h2>
        <form
          className="formulario tarjeta tarjeta--relleno"
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
          <CampoFormulario etiqueta="Contraseña actual" obligatorio error={formulario.errores.passwordActual}>
            {(props) => (
              <input
                {...props}
                className="control"
                type="password"
                autoComplete="current-password"
                {...formulario.registrar('passwordActual')}
              />
            )}
          </CampoFormulario>
          <CampoFormulario
            etiqueta="Contraseña nueva"
            obligatorio
            ayuda="De 8 a 72 caracteres."
            error={formulario.errores.passwordNueva}
          >
            {(props) => (
              <input
                {...props}
                className="control"
                type="password"
                autoComplete="new-password"
                {...formulario.registrar('passwordNueva')}
              />
            )}
          </CampoFormulario>
          <CampoFormulario
            etiqueta="Repetir la contraseña nueva"
            obligatorio
            error={formulario.errores.repetir}
          >
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
          <div className="formulario__acciones">
            <button type="submit" className="boton boton--primario" disabled={cambiar.isPending}>
              {cambiar.isPending ? 'Guardando…' : 'Cambiar la contraseña'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
