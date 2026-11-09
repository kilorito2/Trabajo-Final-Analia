// La sesión vive en sessionStorage y no en localStorage: se borra al cerrar la pestaña,
// así que en una PC compartida del hospital no queda abierta para la siguiente persona.
// Es accesible desde JavaScript; el riesgo de XSS se mitiga con la CSP de nginx y
// porque nunca se usa innerHTML (ver docs/decisiones-frontend.md).
const CLAVE = 'farmacia.sesion';

export function guardarSesion<T extends { token: string }>(sesion: T): void {
  sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
}

function leerSesionGuardada(): unknown {
  const texto = sessionStorage.getItem(CLAVE);
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    sessionStorage.removeItem(CLAVE);
    return null;
  }
}

export function leerToken(): string | null {
  const sesion = leerSesionGuardada();
  if (
    typeof sesion === 'object' &&
    sesion !== null &&
    'token' in sesion &&
    typeof sesion.token === 'string'
  ) {
    return sesion.token;
  }
  return null;
}

export function borrarSesionGuardada(): void {
  sessionStorage.removeItem(CLAVE);
}
