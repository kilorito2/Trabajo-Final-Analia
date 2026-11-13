# Decisiones de diseño

Registro de las decisiones del backend, en el orden en que se tomaron, y al final las del frontend.
Cada una dice qué se decidió y por qué.

## Problemas del prototipo y cómo se evitan

| # | Problema del prototipo | Cómo se evita | Test que lo demuestra |
|---|---|---|---|
| 1 | Los permisos dependían de un id que mandaba el navegador en una cabecera. | El usuario sale solo del JWT validado (`sub`). Rol y permisos se cargan de la base en cada pedido (`UsuarioJwtConverter`). | `SeguridadIT.laCabeceraXUserIdNoCambiaLaIdentidad`, `SeguridadIT.tokenDeUnUsuarioDesactivadoDevuelve401` |
| 2 | La clave del JWT estaba en el código. | `JWT_SECRET` por variable de entorno, mínimo 32 bytes; si falta, la app no arranca y el mensaje no muestra la clave. | `ConfiguracionTest.noArrancaSinJwtSecret`, `ConfiguracionTest.noArrancaConUnaClaveDeMenosDe32BytesYNoLaImprime` |
| 3 | El stock podía quedar negativo y una cantidad negativa sumaba stock. | `@Positive` en la entrada, invariantes en `Lote`, CHECK en la base y bloqueo pesimista ordenado por id. | `TransferenciaServiceTest`, `LoteTest`, `TransferenciaConcurrenciaIT` |
| 4 | La API devolvía el hash de la contraseña. | Nunca se devuelven entidades, solo records. Ningún DTO tiene el hash. | `SeguridadIT.ningunaRespuestaExponeLaContrasenaNiElHash` |
| 5 | Cualquiera podía registrarse sin estar logueado. | No hay endpoint de registro. Solo `USUARIO_GESTIONAR` crea usuarios. | `SeguridadIT.farmaceuticoNoPuedeGestionarUsuarios`, `SeguridadIT.sinTokenDevuelve401EnJsonSinRedirigir` |
| 6 | Fechas como texto y sin alertas de vencimiento. | `LocalDate` / `OffsetDateTime`, columnas `date` / `timestamptz`, alertas calculadas con un `Clock`. | `AlertaServiceTest` |
| 7 | Borrar un proveedor borraba en cascada productos e historial. | Bajas lógicas. Claves foráneas sin cascada (ver `V1__esquema.sql`). | `ProveedorServiceTest` |
| 8 | Errores genéricos sin mensaje, sin tests y dependencias mezcladas. | ProblemDetail con `detail` y `codigo`, tests en `verify`, versiones del BOM de Spring Boot. | `ErroresIT`, `./mvnw verify` |

## Decisiones tomadas antes de empezar

| Tema | Decisión | Por qué |
|---|---|---|
| Versión de Spring Boot | 4.1.2 (última patch estable de la 4.1). | La 3.5 perdió el soporte gratuito el 30/06/2026. La 4.1 tiene soporte hasta julio de 2027. |
| Librería JWT | Ninguna externa: OAuth2 Resource Server + Nimbus con HS256. | Spring valida firma, expiración y emisor. No hay filtro JWT escrito a mano. |
| Duración del token | 8 h, sin refresh token. | Dura un turno. El refresh queda como mejora futura. |
| Baja de un proveedor con lotes con stock | Se permite. Sus lotes siguen disponibles, pero no se lo puede elegir en ingresos nuevos. | Dejar de comprarle no hace desaparecer su mercadería. |
| Bajas y reactivaciones | `PATCH /{id}/estado {activo}`, sin `DELETE`. | `DELETE` sugiere un borrado que no existe y un solo endpoint permite reactivar. |
| Ajustes de stock | `POST /api/lotes/{id}/ajuste`. | Hace falta para roturas y diferencias de conteo. |
| Colección de la API | `docs/api/farmacia.http` + Swagger UI en dev y demo. | El `.http` queda versionado; Swagger sirve para la defensa. |
| Exportación a Excel | CSV con `;`, UTF-8 con BOM, generado por el backend. | Exporta todo lo filtrado y abre directo en Excel en español. |
| Permisos | El backend los define por rol y los devuelve en `/api/auth/me`. | Una sola fuente de verdad. |
| Datos demo | `ApplicationRunner` con `@Profile("demo")` que usa los servicios. | Fechas relativas a hoy, contraseñas con BCrypt y movimientos que cierran con el stock. |
| Formato | Spotless + google-java-format 1.35.0 en `verify`. | El formato lo garantiza la build. |
| Estructura | Monorepo: `backend/`, `frontend/`, `docs/`, `docker-compose.yml`. | `docker compose up` levanta todo. |

## Decisiones durante la implementación

1. **Sin CSRF y sin sesión.** La API se autentica con `Authorization: Bearer` y no usa cookies, así
   que el navegador no puede mandar credenciales por su cuenta y CSRF no aplica. La sesión es
   `STATELESS`.
2. **Usuario y permisos en cada pedido.** El token solo lleva `iss`, `sub`, `iat` y `exp`. El
   `UsuarioJwtConverter` busca el usuario por `sub`; si no existe o está inactivo lanza una
   `DisabledException` y el pedido termina en 401. Una baja o un cambio de rol tienen efecto
   inmediato.
3. **401 y 403 en JSON.** `ErroresSeguridad` implementa el `AuthenticationEntryPoint` y el
   `AccessDeniedHandler` con el `JsonMapper` de Jackson 3 que configura Spring Boot (ya trae el
   mixin de ProblemDetail). El 403 de `@PreAuthorize` se lanza dentro del controlador, por eso el
   `ManejadorErrores` también lo traduce.
4. **Código `PROPIO_USUARIO`.** La regla "nadie puede desactivarse a sí mismo" no tenía código en el
   contrato. Se agregó `409 PROPIO_USUARIO`.
5. **Consultas de stock con SQL.** El listado de medicamentos filtra y ordena por valores
   calculados (stock total, estado, próximo vencimiento). Se resolvió con un fragmento de
   repositorio (`MedicamentoConsultasImpl`) que usa `JdbcClient` con una subconsulta agrupada por
   medicamento y `:hoy` como parámetro, más una consulta de conteo propia. Los campos de orden
   salen de una lista blanca, así que no hay riesgo de inyección.
6. **Próximo vencimiento.** Es el menor vencimiento entre los lotes con stock y no vencidos, igual
   que el stock total. Un lote vencido con stock aparece en las alertas, no como "próximo".
7. **Códigos de medicamento en mayúsculas.** Se normalizan con `trim` y mayúsculas para que `amox-500`
   y `AMOX-500` no convivan.
8. **Fecha de vencimiento validada en el servicio.** `@FutureOrPresent` usa el reloj del sistema
   (UTC en el contenedor); el servicio usa el `Clock` con zona de Argentina y devuelve el mismo 400
   `VALIDACION` con `errors.fechaVencimiento`.
9. **Las alertas filtran en el servicio.** La consulta trae los lotes con stock que vencen hasta
   `hoy + N`; la clasificación vencido / por vencer (y los bordes) se hace en `AlertaService`, que
   es lo que prueba `AlertaServiceTest` con un `Clock` fijo.
10. **Reloj del perfil demo.** Para que las transferencias de ejemplo queden repartidas en los
    últimos 30 días pasando por `TransferenciaService`, el perfil demo usa un `RelojDemo` que la
    carga retrocede y después vuelve a la hora real. Los lotes vencidos se insertan con el
    repositorio, porque el servicio de ingreso los rechazaría.
11. **Tests de integración en un solo contexto.** Todos extienden `IntegracionBase` (misma
    configuración), así Spring reutiliza un único contexto y un único contenedor de PostgreSQL. Los
    datos no se borran entre tests: cada test usa códigos y nombres únicos. Las dependencias de los
    tests se inyectan como parámetros de `@BeforeEach`, sin `@Autowired` en campos.
12. **Endpoint de prueba para el 500.** `ControladorDePrueba` existe solo en `src/test` y lanza una
    excepción para verificar que el 500 tiene `errorId` y no expone el stacktrace.
13. **Recuperación de contraseña simulada.** La consigna del TFI la pide "real o simulada" y los
    usuarios no tienen correo cargado. Se pide con el usuario, se genera un código de 6 números con
    `SecureRandom`, se guarda con BCrypt en `recuperacion_password` y vence en 15 minutos. El envío
    pasa por la interfaz `NotificadorRecuperacion`: hoy `CorreoSimulado` solo deja constancia en el
    log (sin el código) y, con `farmacia.recuperacion.mostrar-codigo` (perfiles `demo` y `test`), la
    respuesta trae el código para mostrarlo en pantalla. Un envío real se agrega implementando la
    interfaz. La respuesta es la misma exista o no el usuario y el hash se calcula siempre, para no
    revelar qué usuarios hay. Los intentos fallidos se cuentan con bloqueo pesimista y la
    transacción no se revierte en ese error (`noRollbackFor`), así el contador queda guardado.
14. **Reportes en CSV y PDF desde el mismo modelo.** Cada servicio arma un `Reporte` (título,
    filtros, columnas y filas ya formateadas) y `Exportador` lo convierte. Así el CSV y el PDF
    muestran siempre los mismos datos y agregar un reporte es armar las filas. El PDF usa OpenPDF
    (libre, LGPL/MPL) con la identidad del sistema; el CSV mantiene el formato que ya usaba Excel.
    `formato` es un parámetro del mismo endpoint de cada listado (`/exportar`), con los mismos
    filtros, y por defecto es CSV para no romper a los clientes existentes.
15. **Excel de verdad (.xlsx) además del CSV.** Un CSV no guarda anchos de columna: Excel lo abría
    con las columnas angostas y la fecha con hora como `##########`. `ReporteXlsx` (con fastexcel,
    liviana y Apache 2.0) arma la planilla con título, filtros, encabezado con color fijo al
    desplazarse, filtros de columna, anchos según el contenido, cantidades como números y fechas
    como fechas, así se pueden ordenar y sumar. El botón "Excel" del front baja el .xlsx; el CSV
    sigue disponible en la API.

## Frontend

Decisiones de la interfaz (React, en `frontend/`). Cada fila dice qué se eligió, contra qué y por qué.

| Decisión | Alternativas | Por qué |
|---|---|---|
| React 19 + Vite 8 + TypeScript strict + React Router 8 | HTML y JS sin framework | Los tipos del contrato salen del OpenAPI del backend: un error de contrato aparece al compilar y no en producción. |
| Proyecto armado a mano, sin la plantilla de Vite | `npm create vite` | La plantilla trae logos, CSS y contadores de ejemplo que habría que borrar; el prototipo anterior fallaba justamente por arrastrar archivos que no se usaban. |
| TypeScript 6.0 y ESLint 9 | TypeScript 7 y ESLint 10 | typescript-eslint todavía no soporta TS 7 y eslint-plugin-jsx-a11y todavía no soporta ESLint 10. Se actualizan cuando lo hagan. |
| TanStack Query para los datos del servidor | `useEffect` + `useState` en cada pantalla | Carga, error, caché e invalidación en un solo lugar; evita la lógica duplicada del prototipo. |
| Reintento: una sola vez y solo ante red caída o 5xx | Reintentos por defecto (3) | Un 4xx no se arregla reintentando. Un tiempo agotado (15 s) tampoco se reintenta, para no dejar a la persona esperando 30 s. |
| Un único cliente (`src/api/cliente.ts`) que no importa el router | Llamar a `fetch` desde cada pantalla | Un solo lugar para el token, los errores y el tiempo máximo. Recibe `alExpirarSesion` y `alProhibido` como callbacks, así se testea sin React. |
| Rutas relativas `/api/...`, con proxy de Vite en desarrollo y de nginx en producción | URL absoluta del backend + CORS | No hace falta CORS en ningún entorno. `VITE_API_URL` es opcional, solo para apuntar a otro servidor. |
| Sesión en `sessionStorage` | `localStorage`; cookie HttpOnly | Se borra al cerrar la pestaña (PC compartida). Es accesible desde JavaScript: el riesgo de XSS se mitiga con la CSP estricta de nginx, con JSX (que escapa todo) y con ESLint prohibiendo `innerHTML` y `dangerouslySetInnerHTML`. La cookie HttpOnly obligaría a manejar CSRF y a cambiar el backend, que usa Bearer. |
| Las fechas `LocalDate` se tratan como texto (`utils/fechas.ts`) | `new Date("2026-11-30")` | `new Date` interpreta ese texto como medianoche UTC y en Argentina muestra el día anterior. "Hoy" se calcula en la zona `America/Argentina/Buenos_Aires`, la misma que usa el backend. |
| El formato del `ProblemDetail` se describe a mano en `api/errores.ts` | Tomarlo del OpenAPI | springdoc no documenta las respuestas de error. Se lee sin confiar en su forma (cada propiedad se valida). |
| Estados de stock y de lote como mapa estado → {texto, tono} | Insignias solo de color | El estado nunca se comunica solo con color. Cuando exista `esquema.ts`, `tipos.ts` verifica que los valores coincidan con los enums del backend. |
| Formularios con `useFormulario` propio | React Hook Form, Formik | Son pocos formularios y simples. Valida al salir del campo y al enviar, nunca en cada tecla, y ubica los `errors` del servidor debajo de cada campo. |
| Modales con `<dialog>` nativo | Librería de modales | `showModal()` ya bloquea el fondo, cierra con Escape y atrapa el foco. El foco vuelve al botón que lo abrió. |
| `<title>` de cada página con el `<title>` de React 19 | Hook que modifica `document.title` | React 19 lo lleva solo al `<head>`. |
| Errores de red y de servidor en acciones: aviso global (`MutationCache`) | Manejo en cada formulario | Los 400/409 sí los muestra cada formulario junto a sus campos; el 403 lo avisa el cliente; el resto se avisa en un solo lugar. |
| Las cabeceras de seguridad de nginx en `nginx-cabeceras.conf`, incluido en cada `location` | Repetirlas en cada bloque | nginx no hereda los `add_header` del `server` en una `location` que define los suyos (las de caché). |
| Imagen `nginxinc/nginx-unprivileged:1.30.6-alpine` | `nginx:latest` | Versión fija de la rama estable y sin root. |
| Contrato provisorio (`frontend/contrato/openapi-provisorio.yaml`) y backend simulado (`frontend/mock/servidor.mjs`) | Esperar al backend; escribir los tipos a mano | Permitió construir y probar todas las pantallas antes de que existiera el backend, con los tipos generados del YAML igual que del OpenAPI real. Se mantienen después de integrar el backend: el mock sirve para trabajar en las pantallas sin levantar Java ni la base. No entra en el build ni en la imagen Docker. |
| `SesionProvider` dentro del router y redirección al ingreso solo desde `RutaProtegida` | Navegar desde el callback del cliente | React Router navega dentro de una transición: si el provider limpiaba el usuario y navegaba, `RutaProtegida` redirigía antes y se perdía `?motivo=expirada`. Un test lo detectó. Además, después de "Salir" no se recuerda la página anterior, para que la siguiente persona empiece en el panel. |
| Al recargar se pide `/api/auth/me` y no se guarda el usuario en `sessionStorage` | Guardar el usuario con el token | Los permisos siempre salen frescos del backend; en el navegador solo quedan el token y su vencimiento. |
| Borrador de la transferencia en `sessionStorage`, validado al leerlo | Estado solo en memoria | Si la sesión vence o el backend responde 409, no se pierde lo cargado. Un borrador con forma inválida se descarta. |
| Doble clic en "Confirmar transferencia" bloqueado con un `ref` además del botón deshabilitado | Solo `disabled` | El segundo clic puede llegar antes de que React vuelva a renderizar el botón deshabilitado. |
| Redirección después del ingreso solo a rutas internas | Usar `state.desde` tal cual | Evita redirigir a otro sitio con un `state` manipulado. |
| Estilo hospitalario: menú lateral oscuro, logo de cruz sanitaria de brazos entrelazados, tarjetas con sombra suave e íconos de Lucide | Mantener el estilo plano inicial | Se ve más profesional y reconocible como sistema de salud sin perder contraste AA: los colores nuevos están verificados en `tokens.css` y axe no reporta violaciones graves. |
| Pantalla **Reportes** que agrupa los reportes, con "Ver en pantalla" y descarga en Excel (.xlsx) o PDF | Un botón de exportar en cada listado | La consigna exige reportes (mostrar y exportar). Juntos se encuentran fácil; el historial de transferencias y el comprobante mantienen además sus propios botones. |
| Descargas con `useDescarga`: un estado por botón y el error como aviso | Estado de carga en cada pantalla | El mismo patrón en Reportes, Transferencias y el comprobante. |
| Ingreso y recuperación de contraseña: solo el formulario centrado, con el logo y el nombre del sistema (`MarcoIngreso`) | Panel de presentación al costado | Pedido del usuario: la pantalla queda más limpia. La recuperación tiene URL propia (`/recuperar`) porque es un flujo de dos pasos. |
| Tablas sin desborde de 900 a 1600 px: celdas compactas hasta 1365 px, panel en una columna hasta 1439 px y menú en la barra superior por debajo de 1100 px | Dejar el desplazamiento horizontal | Con el zoom de Windows (125 %) una pantalla de 1600 px queda en 1280 px y la tabla se cortaba. Más angosto que 900 px la tabla se desliza dentro de su tarjeta. |
| Botones de acción de las tablas uno al lado del otro y separados; "Dar de baja" con borde rojo | Botones de texto apilados | Apilados era fácil apretar el equivocado. El rojo marca la acción que no se puede deshacer. |
| Si el foco sale de un campo hacia el botón de enviar, no se valida al salir | Validar siempre al salir | El mensaje de error desaparecía al apretar el botón, el botón subía y el clic caía afuera. El envío valida todo igual. |

### Diferencias con el contrato de la API

| Tema | Qué pasa | Qué se hizo |
|---|---|---|
| Número de transferencia en movimientos | `MovimientoResponse` trae `transferenciaId` pero no el número `TR-000123`, que el historial de movimientos tiene que mostrar. | **Pedido al backend**: agregar `transferenciaNumero`. Mientras tanto la columna muestra un enlace "Ver transferencia"; el front no arma el formato. |
| Campos obligatorios y nulos en el OpenAPI | springdoc solo marca como obligatorio lo que tiene `@NotNull`/`@NotBlank`, y los `record` de respuesta no suelen tenerlo. Sin eso, todos los campos de las respuestas se generan como opcionales en TypeScript. | **Pedido al backend**: marcar los campos de respuesta como obligatorios (`@Schema(requiredMode = REQUIRED)`) y los que pueden venir en `null` como `nullable` (`proximoVencimiento`, `transferenciaId`, `motivo`, `observaciones`, `telefono`, `email`). Si no se puede, `openapi-typescript` tiene la opción `--properties-required-by-default`. |
| Nombres de los esquemas | Los nombres reales que genere springdoc (por ejemplo, `PagedModelMedicamentoResponse` o el de los records anidados de `TransferenciaResponse`) pueden no coincidir con los del contrato provisorio. | Solo `src/api/tipos.ts` los nombra: se corrige ese archivo al regenerar. |
| Lotes del detalle de un medicamento | `MedicamentoDetalleResponse` ya trae los lotes con stock en orden FEFO. | Se usan esos lotes en vez de pedir `GET /api/lotes?medicamentoId=`. |
| Exportación CSV | `desde` y `hasta` son obligatorios y el rango es de hasta 366 días. | El botón se deshabilita sin fechas y avisa si el rango es mayor. |
| Búsqueda de usuarios | El backend acepta `q`. | Se agrega el buscador a la lista de usuarios. |

### Notas

- `npm audit` informa vulnerabilidades moderadas en `minimatch`, que llega por typescript-eslint. Es una herramienta de desarrollo que no entra en el build. Se revisa cuando typescript-eslint actualice la dependencia.
- El `<input type="date">` muestra el formato que corresponde al idioma del navegador (en un Chrome en español, `dd/mm/aaaa`). El valor que se envía siempre es `aaaa-mm-dd`.
