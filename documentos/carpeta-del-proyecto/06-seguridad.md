# 6. Seguridad

## 6.1 Autenticación (quién sos)

```mermaid
sequenceDiagram
    actor P as Persona
    participant F as Frontend
    participant B as Backend
    participant D as Base de datos
    P->>F: usuario + contraseña
    F->>B: POST /api/auth/login
    B->>D: buscar usuario (en minúsculas)
    B->>B: BCrypt: ¿la contraseña coincide con el hash?
    alt no coincide / no existe / inactivo
        B-->>F: 401 "Usuario o contraseña incorrectos."
    else coincide
        B->>B: firmar JWT (sub = id, exp = +8 h)
        B-->>F: 200 {token, expiraEn, usuario + permisos}
        F->>F: guardar token en sessionStorage
    end
    Note over F,B: En cada pedido siguiente
    F->>B: GET /api/... con Authorization: Bearer <token>
    B->>B: validar firma, vencimiento y emisor
    B->>D: buscar usuario por id; ¿activo? leer rol
    B->>B: permisos = permisos del rol actual
```

| Medida | Detalle | Dónde |
|---|---|---|
| Hash de contraseñas | BCrypt, factor 12 (2¹² rondas). Contraseña de 8 a 72 caracteres (BCrypt no admite más de 72 bytes). | `SeguridadConfig.passwordEncoder` |
| Mismo error en todos los casos | Usuario inexistente, inactivo o contraseña incorrecta → mismo 401 y mismo mensaje. `DaoAuthenticationProvider` calcula un hash aunque el usuario no exista, para que el tiempo de respuesta tampoco lo revele. | `AuthService`, `SeguridadConfig` |
| Token JWT | HS256 (HMAC con SHA-256). Claims: `iss` (farmacia-hospitalaria), `sub` (id del usuario), `iat`, `exp`. **Sin rol ni datos personales.** Dura 8 horas. | `TokenService` |
| Clave del token | `JWT_SECRET` por variable de entorno, mínimo 32 bytes. Si falta o es corta, la aplicación no arranca y el mensaje no muestra la clave. | `JwtProperties` |
| Validación del token | Firma, vencimiento (con el reloj de la aplicación y 60 s de tolerancia) y emisor. | `SeguridadConfig.jwtDecoder` |
| Usuario en cada pedido | Se busca por el `sub`; si no existe o está inactivo → 401. Los permisos son los del rol **actual** en la base. | `UsuarioJwtConverter` |
| Sin sesión del servidor | `STATELESS`. Sin cookies. | `SeguridadConfig` |
| Sin registro público | Solo `USUARIO_GESTIONAR` crea usuarios. | `UsuarioController` |
| Primer administrador | Si no hay ningún ADMIN al arrancar, se crea `admin` con `ADMIN_PASSWORD`. Si ya hay uno, la variable se ignora. | `AdminInicial` |

### Recuperación de contraseña (simulada)

- Se pide con el nombre de usuario. La respuesta es **la misma exista o no** el usuario.
- Código de 6 números generado con `SecureRandom`, guardado con **BCrypt** (nunca en texto), vence
  a los **15 minutos**, se anulan los pedidos anteriores.
- **5 intentos** fallidos y el código se anula aunque el siguiente sea el correcto. El contador se
  guarda aunque la operación falle (`noRollbackFor`) y se incrementa con bloqueo pesimista, para
  que dos intentos simultáneos no lo burlen.
- El envío pasa por la interfaz `NotificadorRecuperacion`. La implementación actual
  (`CorreoSimulado`) solo deja constancia en el log, **sin el código**. En los perfiles `demo` y
  `test` la respuesta incluye el código para mostrarlo en pantalla. Para enviar correos reales
  alcanza con otra implementación de la interfaz.

## 6.2 Autorización (qué podés hacer)

| Permiso | Habilita | ADMIN | FARMACÉUTICO | CONSULTA |
|---|---|:-:|:-:|:-:|
| `LECTURA` | Todos los `GET` salvo usuarios; reportes | ✓ | ✓ | ✓ |
| `CATALOGO_EDITAR` | Alta, edición y estado de proveedores, áreas y medicamentos | ✓ | ✓ | — |
| `STOCK_INGRESAR` | Ingreso de lotes | ✓ | ✓ | — |
| `STOCK_BAJA_AJUSTE` | Bajas por vencimiento y ajustes | ✓ | ✓ | — |
| `TRANSFERENCIA_CREAR` | Crear transferencias | ✓ | ✓ | — |
| `USUARIO_GESTIONAR` | Todo `/api/usuarios` | ✓ | — | — |

- El mapa rol → permisos está en **un solo lugar**: el enum `Rol`.
- Cada método de los controladores declara su permiso: `@PreAuthorize("hasAuthority('CATALOGO_EDITAR')")`.
- El frontend recibe los permisos en `/api/auth/me` y **oculta** lo que no corresponde
  (`puede(permiso)`), pero **la seguridad real está en el backend**: aunque alguien escriba la URL o
  modifique el navegador, el servidor responde 403.
- Reglas adicionales: nadie se desactiva a sí mismo (`PROPIO_USUARIO`); no se puede dejar el
  sistema sin administradores activos (`ULTIMO_ADMIN`).

## 6.3 Protección de datos

| Riesgo | Medida |
|---|---|
| Exponer el hash de la contraseña | Las respuestas son `record` DTO; ningún DTO tiene el hash. Prueba: `SeguridadIT.ningunaRespuestaExponeLaContrasenaNiElHash`. |
| Secretos en el repositorio | `JWT_SECRET`, `ADMIN_PASSWORD`, `DB_PASSWORD` solo por variables de entorno; `.env` está en `.gitignore`. |
| Datos sensibles en los logs | Nunca se registran el token, la contraseña ni el cuerpo del login. El código de recuperación tampoco. |
| Errores con información interna | El 500 responde solo "Ocurrió un error inesperado." con un `errorId`; el detalle queda en el log. `include-stacktrace: never`. |
| Endpoints de administración expuestos | Actuator solo publica `/actuator/health`, sin detalles. Swagger apagado en `prod`. |
| Base de datos accesible desde la red | Docker publica el puerto solo en `127.0.0.1`. |

## 6.4 Vulnerabilidades web consideradas (OWASP Top 10)

| Riesgo | Cómo se mitiga |
|---|---|
| **A01 Control de acceso roto** | Identidad solo del JWT validado (una cabecera `X-User-Id` se ignora: `SeguridadIT`); permisos en cada método; el usuario de una transferencia sale del token, nunca del cuerpo del pedido. |
| **A02 Fallas criptográficas** | BCrypt; HMAC-SHA256 con clave de 32+ bytes; códigos de recuperación hasheados. |
| **A03 Inyección SQL** | Consultas parametrizadas (JPA y `JdbcClient` con parámetros nombrados); los campos de orden salen de una lista blanca. |
| **A03 Inyección de fórmulas (CSV)** | Valores que empiezan con `=`, `+`, `-`, `@`, tab o CR llevan `'` adelante (`CsvTest`). |
| **A03 XSS (Cross-Site Scripting)** | React escapa todo el texto; ESLint prohíbe `innerHTML` y `dangerouslySetInnerHTML`; CSP estricta en nginx. Prueba: un medicamento llamado `<img src=x onerror=alert(1)>` se ve como texto (`seguridad.test.tsx`). |
| **A04 Diseño inseguro** | "Todo o nada" y bloqueos en las transferencias; invariantes en entidad y base. |
| **A05 Configuración insegura** | La aplicación no arranca sin clave, con clave corta ni con `demo` y `prod` juntos (`ConfiguracionTest`). Imágenes Docker sin root. |
| **A07 Fallas de autenticación** | Mismo mensaje en todos los errores de login; tokens con vencimiento; usuario desactivado → 401 inmediato. |
| **CSRF** | No aplica: la API no usa cookies, el token se manda a mano en una cabecera que el navegador no agrega solo. Por eso CSRF está deshabilitado (decisión documentada). |
| **CORS** | Vacío por defecto (mismo origen detrás del proxy). Si se configura, nunca `*`. |

## 6.5 Seguridad en el frontend

| Medida | Detalle |
|---|---|
| Token en `sessionStorage` | Se borra al cerrar la pestaña (útil en PC compartidas). Nunca va en la URL ni en los logs. |
| 401 | Borra la sesión y lleva al ingreso con "Tu sesión expiró". |
| 403 | Muestra "No tenés permiso para esta acción." y refresca los permisos. |
| Aviso de vencimiento | 5 minutos antes de que venza el token. |
| Salir | Borra la sesión y la caché de datos; la siguiente persona empieza en el panel. |
| Redirecciones | Después del ingreso solo se vuelve a rutas internas (no a sitios externos). |
| Cabeceras de nginx | `Content-Security-Policy` estricta (solo recursos del propio sitio, `frame-ancestors 'none'` para que nadie lo meta en un iframe), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `Permissions-Policy` que apaga cámara, micrófono, ubicación, pagos y USB (archivo `frontend/nginx-cabeceras.conf`). |

## 6.6 Pruebas de seguridad

`SeguridadIT` verifica: 401 sin token (en JSON, sin redirigir); 401 con firma inválida, token
vencido y usuario desactivado; 403 de CONSULTA creando un medicamento y de FARMACÉUTICO en
usuarios; que la cabecera `X-User-Id` no cambia nada; mismo 401 para contraseña incorrecta y
usuario inexistente; y que ninguna respuesta contiene `password` ni `hash`. `ConfiguracionTest`
verifica el arranque seguro y `RecuperacionIT` / `RecuperacionPasswordTest` la recuperación.
