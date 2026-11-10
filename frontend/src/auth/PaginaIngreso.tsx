import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { BellRing, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { iniciarSesion } from '../api/auth';
import { MENSAJES, mensajeDeError } from '../api/errores';
import { Logo, Marca } from '../components/Logo';
import { useSesion } from './SesionProvider';

function destinoGuardado(estado: unknown): string {
  if (
    typeof estado === 'object' &&
    estado !== null &&
    'desde' in estado &&
    typeof estado.desde === 'string'
  ) {
    // Solo rutas internas: evita redirigir a otro sitio.
    if (estado.desde.startsWith('/') && !estado.desde.startsWith('//')) return estado.desde;
  }
  return '/';
}

export function PaginaIngreso() {
  const { usuario, iniciarSesion: guardarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(
    parametros.get('motivo') === 'expirada' ? MENSAJES.sesionExpirada : null,
  );

  if (usuario) return <Navigate to={destinoGuardado(ubicacion.state)} replace />;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    if (!username.trim() || !password) {
      setError('Ingresá tu usuario y tu contraseña.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await iniciarSesion({ username: username.trim(), password });
      guardarSesion(respuesta);
      navegar(destinoGuardado(ubicacion.state), { replace: true });
    } catch (causa) {
      setError(mensajeDeError(causa));
      setEnviando(false);
    }
  }

  return (
    <main className="ingreso">
      <title>Ingresar · Farmacia</title>
      <section className="ingreso__presentacion" aria-label="Presentación">
        <Marca subtitulo="Hospital público" />
        <div className="ingreso__mensaje">
          <p className="ingreso__titular">Control de stock de la farmacia del hospital</p>
          <p>Medicamentos, lotes y vencimientos en un solo lugar, con trazabilidad de cada unidad.</p>
        </div>
        <ul className="ingreso__puntos">
          <li>
            <ClipboardCheck size={20} aria-hidden="true" />
            Transferencias a las áreas por orden de vencimiento
          </li>
          <li>
            <BellRing size={20} aria-hidden="true" />
            Alertas de lotes por vencer y de stock bajo
          </li>
          <li>
            <ShieldCheck size={20} aria-hidden="true" />
            Acceso por roles y registro de cada movimiento
          </li>
        </ul>
      </section>
      <div className="ingreso__lado-formulario">
        <form className="ingreso__tarjeta" onSubmit={enviar} noValidate>
          <div className="ingreso__encabezado">
            <Logo tamano={40} />
            <h1>Ingresar</h1>
            <p className="texto-suave">Usá el usuario que te dio el administrador.</p>
          </div>
          {error && (
            <p className="mensaje mensaje--peligro" role="alert">
              {error}
            </p>
          )}
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="usuario">
              Usuario
            </label>
            <input
              id="usuario"
              className="control"
              autoComplete="username"
              // El foco inicial va al usuario: es lo único que se hace en esta pantalla.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              className="control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="boton boton--primario ingreso__boton" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
