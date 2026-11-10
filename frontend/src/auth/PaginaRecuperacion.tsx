import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { confirmarRecuperacion, solicitarRecuperacion } from '../api/auth';
import type { SolicitudRecuperacionResponse } from '../api/tipos';
import { CampoFormulario } from '../components/CampoFormulario';
import { Marca } from '../components/Logo';
import { useFormulario } from '../hooks/useFormulario';
import { combinar, longitudEntre, obligatorio } from '../utils/validaciones';
import { MarcoIngreso } from './MarcoIngreso';
import { useSesion } from './SesionProvider';

const VACIO = { username: '', codigo: '', passwordNueva: '', repetir: '' };

const validacionesSolicitud = { username: obligatorio };

const validacionesConfirmacion = {
  username: obligatorio,
  codigo: (valor: string) => (/^\d{6}$/.test(valor.trim()) ? null : 'El código tiene 6 números.'),
  passwordNueva: combinar(obligatorio, longitudEntre(8, 72)),
  repetir: (valor: string, valores: typeof VACIO) =>
    valor === valores.passwordNueva ? null : 'Las contraseñas no coinciden.',
};

/**
 * Recuperación en dos pasos: pedir un código con el usuario y después usarlo para crear una
 * contraseña nueva. El envío del código es simulado: el backend del perfil demo lo devuelve.
 */
export function PaginaRecuperacion() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [solicitud, setSolicitud] = useState<SolicitudRecuperacionResponse | null>(null);
  const [enviando, setEnviando] = useState(false);
  const formulario = useFormulario(VACIO, solicitud ? validacionesConfirmacion : validacionesSolicitud);

  if (usuario) return <Navigate to="/cuenta" replace />;

  async function pedirCodigo() {
    if (enviando || !formulario.validarTodo()) return;
    setEnviando(true);
    try {
      setSolicitud(await solicitarRecuperacion({ username: formulario.valores.username.trim() }));
    } catch (error) {
      formulario.aplicarErrorServidor(error);
    } finally {
      setEnviando(false);
    }
  }

  async function crearPassword() {
    if (enviando || !formulario.validarTodo()) return;
    setEnviando(true);
    try {
      await confirmarRecuperacion({
        username: formulario.valores.username.trim(),
        codigo: formulario.valores.codigo.trim(),
        passwordNueva: formulario.valores.passwordNueva,
      });
      navegar('/ingresar?motivo=recuperada', { replace: true });
    } catch (error) {
      formulario.aplicarErrorServidor(error);
      setEnviando(false);
    }
  }

  return (
    <MarcoIngreso titulo="Recuperar la contraseña">
      <form
        className="ingreso__tarjeta"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void (solicitud ? crearPassword() : pedirCodigo());
        }}
      >
        <div className="ingreso__encabezado">
          <Marca />
          <h1>Recuperar la contraseña</h1>
          <p className="texto-suave">
            {solicitud
              ? 'Ingresá el código y elegí una contraseña nueva.'
              : 'Escribí tu usuario y te enviamos un código para crear una contraseña nueva.'}
          </p>
        </div>

        {formulario.errorGeneral && (
          <p className="mensaje mensaje--peligro" role="alert">
            {formulario.errorGeneral}
          </p>
        )}

        {solicitud && (
          <div className="mensaje mensaje--ok ingreso__codigo" role="status">
            <span>{solicitud.mensaje}</span>
            {solicitud.codigoSimulado && (
              <>
                <span>
                  <MailCheck size={16} aria-hidden="true" /> Correo simulado: tu código es
                </span>
                <strong>{solicitud.codigoSimulado}</strong>
                <span className="texto-sm">Vence en 15 minutos.</span>
              </>
            )}
          </div>
        )}

        <CampoFormulario etiqueta="Usuario" error={formulario.errores.username}>
          {(props) => (
            <input
              {...props}
              className="control"
              autoComplete="username"
              readOnly={Boolean(solicitud)}
              {...formulario.registrar('username')}
            />
          )}
        </CampoFormulario>

        {solicitud && (
          <>
            <CampoFormulario etiqueta="Código" error={formulario.errores.codigo}>
              {(props) => (
                <input
                  {...props}
                  className="control"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  {...formulario.registrar('codigo')}
                />
              )}
            </CampoFormulario>
            <CampoFormulario
              etiqueta="Contraseña nueva"
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
            <CampoFormulario etiqueta="Repetir la contraseña nueva" error={formulario.errores.repetir}>
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
          </>
        )}

        <button type="submit" className="boton boton--primario ingreso__boton" disabled={enviando}>
          {enviando ? 'Enviando…' : solicitud ? 'Crear la contraseña nueva' : 'Enviar el código'}
        </button>

        <div className="ingreso__pie">
          <Link to="/ingresar">
            <ArrowLeft size={14} aria-hidden="true" /> Volver a ingresar
          </Link>
          {solicitud && (
            <button
              type="button"
              className="boton boton--texto boton--chico"
              disabled={enviando}
              onClick={() => {
                setSolicitud(null);
                formulario.reiniciar({ ...VACIO, username: formulario.valores.username });
              }}
            >
              Pedir otro código
            </button>
          )}
        </div>
      </form>
    </MarcoIngreso>
  );
}
