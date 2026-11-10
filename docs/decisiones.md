# Decisiones de diseño

Registro de las decisiones del backend, en el orden en que se tomaron. Cada una dice qué se
decidió y por qué.

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
