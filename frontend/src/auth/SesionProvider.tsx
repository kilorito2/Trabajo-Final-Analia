import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { obtenerUsuarioActual } from '../api/auth';
import { configurarCliente } from '../api/cliente';
import { ErrorApi, MENSAJES, mensajeDeError } from '../api/errores';
import type { LoginResponse, Permiso, UsuarioSesion } from '../api/tipos';
import { useAvisos } from '../components/Avisos';
import { formatearHora } from '../utils/fechas';
import { borrarSesionGuardada, guardarSesion, leerSesion } from './almacenSesion';

type ValorSesion = {
  usuario: UsuarioSesion | null;
  /** Por qué no hay sesión: venció (401) o la persona salió. null al abrir la app. */
  motivoSalida: MotivoSalida;
  iniciarSesion: (respuesta: LoginResponse) => void;
  cerrarSesion: () => void;
  puede: (permiso: Permiso) => boolean;
};

type MotivoSalida = 'expirada' | 'salida' | null;

const AVISO_ANTES_MS = 5 * 60 * 1000;
const ESPERA_MAXIMA_MS = 2 ** 31 - 1;

const Contexto = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { avisar, cerrar } = useAvisos();
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [expiraEn, setExpiraEn] = useState<string | null>(null);
  const [validando, setValidando] = useState(() => leerSesion() !== null);
  const [motivoSalida, setMotivoSalida] = useState<MotivoSalida>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // El cliente no conoce el router: se le pasan estos callbacks. Al expirar no se navega
  // desde acá: RutaProtegida redirige al ingreso (con el motivo) en cuanto no hay usuario.
  useEffect(() => {
    configurarCliente({
      alExpirarSesion: () => {
        queryClient.clear();
        setMotivoSalida('expirada');
        setUsuario(null);
        setExpiraEn(null);
      },
      alProhibido: () => {
        avisar('error', MENSAJES.sinPermiso);
        // El rol pudo haber cambiado: se refrescan los permisos sin cerrar la sesión.
        obtenerUsuarioActual().then(setUsuario, () => {});
      },
    });
  }, [avisar, queryClient]);

  // Al abrir la app con una sesión guardada, se valida y se traen los permisos actuales.
  useEffect(() => {
    const guardada = leerSesion();
    if (!guardada) return;
    let vigente = true;
    obtenerUsuarioActual()
      .then((actual) => {
        if (!vigente) return;
        setUsuario(actual);
        setExpiraEn(guardada.expiraEn);
      })
      .catch((error: unknown) => {
        // Un 401 ya lo resolvió el cliente (borra la sesión y avisa que expiró). Ante una falla de
        // red o del servidor, o una recarga a mitad del pedido, la sesión puede seguir siendo
        // válida: no se borra y se ofrece reintentar.
        const sesionInvalida = error instanceof ErrorApi && error.status === 401;
        if (vigente && !sesionInvalida) setErrorValidacion(mensajeDeError(error));
      })
      .finally(() => {
        if (vigente) setValidando(false);
      });
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentarValidacion = useCallback(() => {
    setErrorValidacion(null);
    setValidando(true);
    setIntento((n) => n + 1);
  }, []);

  // Sin chequeos periódicos: un único temporizador avisa 5 minutos antes del vencimiento.
  useEffect(() => {
    if (!expiraEn) return;
    let idAviso: number | null = null;
    const espera = Math.max(0, Date.parse(expiraEn) - AVISO_ANTES_MS - Date.now());
    // setTimeout dispara al instante si la espera supera ~24,8 días (2^31 - 1 ms).
    if (espera > ESPERA_MAXIMA_MS) return;
    const temporizador = setTimeout(() => {
      idAviso = avisar(
        'advertencia',
        `Tu sesión vence a las ${formatearHora(expiraEn)}. Guardá lo que estés cargando.`,
      );
    }, espera);
    return () => {
      clearTimeout(temporizador);
      if (idAviso !== null) cerrar(idAviso);
    };
  }, [expiraEn, avisar, cerrar]);

  const iniciarSesion = useCallback((respuesta: LoginResponse) => {
    guardarSesion({ token: respuesta.token, expiraEn: respuesta.expiraEn });
    setMotivoSalida(null);
    setUsuario(respuesta.usuario);
    setExpiraEn(respuesta.expiraEn);
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesionGuardada();
    // Para que la siguiente persona en esta PC no vea datos de la anterior.
    queryClient.clear();
    setMotivoSalida('salida');
    setUsuario(null);
    setExpiraEn(null);
  }, [queryClient]);

  const puede = useCallback((permiso: Permiso) => usuario?.permisos.includes(permiso) ?? false, [usuario]);

  const valor = useMemo(
    () => ({ usuario, motivoSalida, iniciarSesion, cerrarSesion, puede }),
    [usuario, motivoSalida, iniciarSesion, cerrarSesion, puede],
  );

  if (validando) {
    return (
      <div className="pantalla-carga" role="status">
        Cargando…
      </div>
    );
  }

  if (errorValidacion) {
    return (
      <div className="pantalla-carga">
        <div className="estado-error" role="alert">
          <p>{errorValidacion}</p>
          <button type="button" className="boton" onClick={reintentarValidacion}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ValorSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSesion tiene que usarse dentro de SesionProvider');
  return contexto;
}
