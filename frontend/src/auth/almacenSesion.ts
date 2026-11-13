// La sesión vive en sessionStorage y no en localStorage: se borra al cerrar la pestaña,
// así que en una PC compartida del hospital no queda abierta para la siguiente persona.
// Es accesible desde JavaScript; el riesgo de XSS se mitiga con la CSP de nginx y
// porque nunca se usa innerHTML (ver la sección Frontend de docs/decisiones.md).
// El usuario no se guarda: al recargar se pide de nuevo a /api/auth/me con permisos frescos.
const CLAVE = 'farmacia.sesion';

type SesionGuardada = { token: string; expiraEn: string };

export function guardarSesion(sesion: SesionGuardada): void {
  sessionStorage.setItem(CLAVE, JSON.stringify({ token: sesion.token, expiraEn: sesion.expiraEn }));
}

export function leerSesion(): SesionGuardada | null {
  const texto = sessionStorage.getItem(CLAVE);
  if (!texto) return null;
  try {
    const valor: unknown = JSON.parse(texto);
    if (
      typeof valor === 'object' &&
      valor !== null &&
      'token' in valor &&
      'expiraEn' in valor &&
      typeof valor.token === 'string' &&
      typeof valor.expiraEn === 'string'
    ) {
      return { token: valor.token, expiraEn: valor.expiraEn };
    }
  } catch {
    // Un valor corrupto se descarta igual que uno con forma inválida.
  }
  sessionStorage.removeItem(CLAVE);
  return null;
}

export function leerToken(): string | null {
  return leerSesion()?.token ?? null;
}

export function borrarSesionGuardada(): void {
  sessionStorage.removeItem(CLAVE);
}
