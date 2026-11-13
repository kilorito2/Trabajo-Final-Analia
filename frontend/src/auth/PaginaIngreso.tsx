import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { iniciarSesion } from '../api/auth';
import { MENSAJES, mensajeDeError } from '../api/errores';
import { Marca } from '../components/Logo';
import { MarcoIngreso } from './MarcoIngreso';
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
  // Cambia en cada intento fallido: como key, remonta el mensaje y repite la sacudida
  // aunque el texto del error sea el mismo.
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const recuperada = parametros.get('motivo') === 'recuperada';
  const [error, setError] = useState<string | null>(
    parametros.get('motivo') === 'expirada' ? MENSAJES.sesionExpirada : null,
  );

  if (usuario) return <Navigate to={destinoGuardado(ubicacion.state)} replace />;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    if (!username.trim() || !password) {
      setError('Ingresá tu usuario y tu contraseña.');
      setIntentosFallidos((n) => n + 1);
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
      setIntentosFallidos((n) => n + 1);
      setEnviando(false);
    }
  }

  return (
    <MarcoIngreso titulo="Ingresar">
      <form className="ingreso__tarjeta" onSubmit={enviar} noValidate>
        <div className="ingreso__encabezado">
          <Marca />
          <h1>Ingresar</h1>
          <p className="texto-suave">Usá el usuario que te dio el administrador.</p>
        </div>
        {recuperada && !error && (
          <p className="mensaje mensaje--ok" role="status">
            Listo, ya podés ingresar con tu contraseña nueva.
          </p>
        )}
        {error && (
          <p
            key={intentosFallidos}
            className={`mensaje mensaje--peligro${intentosFallidos > 0 ? ' mensaje--sacudir' : ''}`}
            role="alert"
          >
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
        <div className="ingreso__pie">
          <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </div>
      </form>
    </MarcoIngreso>
  );
}
