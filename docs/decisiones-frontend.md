# Decisiones del frontend

Se fusiona con `docs/decisiones.md` cuando el backend cree ese archivo.

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
| Contrato provisorio (`frontend/contrato/openapi-provisorio.yaml`) y backend simulado (`frontend/mock/servidor.mjs`) mientras el backend no exista | Esperar al backend; escribir los tipos a mano | Permite construir y probar todas las pantallas sin escribir tipos a mano: los tipos se generan del YAML (escrito desde `Back_v2.md` §8) igual que se van a generar del OpenAPI real. El mock no entra en el build ni en la imagen Docker. Ambos se borran cuando el backend esté levantado. |
| `SesionProvider` dentro del router y redirección al ingreso solo desde `RutaProtegida` | Navegar desde el callback del cliente | React Router navega dentro de una transición: si el provider limpiaba el usuario y navegaba, `RutaProtegida` redirigía antes y se perdía `?motivo=expirada`. Un test lo detectó. Además, después de "Salir" no se recuerda la página anterior, para que la siguiente persona empiece en el panel. |
| Al recargar se pide `/api/auth/me` y no se guarda el usuario en `sessionStorage` | Guardar el usuario con el token | Los permisos siempre salen frescos del backend; en el navegador solo quedan el token y su vencimiento. |
| Borrador de la transferencia en `sessionStorage`, validado al leerlo | Estado solo en memoria | Si la sesión vence o el backend responde 409, no se pierde lo cargado. Un borrador con forma inválida se descarta. |
| Doble clic en "Confirmar transferencia" bloqueado con un `ref` además del botón deshabilitado | Solo `disabled` | El segundo clic puede llegar antes de que React vuelva a renderizar el botón deshabilitado. |
| Redirección después del ingreso solo a rutas internas | Usar `state.desde` tal cual | Evita redirigir a otro sitio con un `state` manipulado. |
| Estilo hospitalario: menú lateral oscuro, logo de cruz sanitaria, tarjetas con sombra suave e íconos de Lucide | Mantener el estilo plano inicial | Se ve más profesional y reconocible como sistema de salud sin perder contraste AA: los colores nuevos están verificados en `tokens.css` y axe no reporta violaciones graves. |
| Pantalla **Reportes** que agrupa los reportes, con "Ver en pantalla" y descarga en Excel (CSV) o PDF | Un botón de exportar en cada listado | La consigna exige reportes (mostrar y exportar). Juntos se encuentran fácil; el historial de transferencias y el comprobante mantienen además sus propios botones. |
| Descargas con `useDescarga`: un estado por botón y el error como aviso | Estado de carga en cada pantalla | El mismo patrón en Reportes, Transferencias y el comprobante. |
| Ingreso y recuperación de contraseña: solo el formulario centrado, con el logo y el nombre del sistema (`MarcoIngreso`) | Panel de presentación al costado | Pedido del usuario: la pantalla queda más limpia. La recuperación tiene URL propia (`/recuperar`) porque es un flujo de dos pasos. |
| Tablas sin desborde de 1024 a 1600 px: botones de acción que pasan de renglón, celdas compactas hasta 1365 px y panel en una columna hasta 1439 px | Dejar el desplazamiento horizontal | Con el zoom de Windows (125 %) una pantalla de 1600 px queda en 1280 px y la tabla se cortaba. |
| Si el foco sale de un campo hacia el botón de enviar, no se valida al salir | Validar siempre al salir | El mensaje de error desaparecía al apretar el botón, el botón subía y el clic caía afuera. El envío valida todo igual. |

## Diferencias con el contrato (`Back_v2.md` §8)

| Tema | Qué pasa | Qué se hizo |
|---|---|---|
| Número de transferencia en movimientos | `MovimientoResponse` trae `transferenciaId` pero no el número `TR-000123`, que el historial de movimientos tiene que mostrar. | **Pedido al backend**: agregar `transferenciaNumero`. Mientras tanto la columna muestra un enlace "Ver transferencia"; el front no arma el formato. |
| Campos obligatorios y nulos en el OpenAPI | springdoc solo marca como obligatorio lo que tiene `@NotNull`/`@NotBlank`, y los `record` de respuesta no suelen tenerlo. Sin eso, todos los campos de las respuestas se generan como opcionales en TypeScript. | **Pedido al backend**: marcar los campos de respuesta como obligatorios (`@Schema(requiredMode = REQUIRED)`) y los que pueden venir en `null` como `nullable` (`proximoVencimiento`, `transferenciaId`, `motivo`, `observaciones`, `telefono`, `email`). Si no se puede, `openapi-typescript` tiene la opción `--properties-required-by-default`. |
| Nombres de los esquemas | Los nombres reales que genere springdoc (por ejemplo, `PagedModelMedicamentoResponse` o el de los records anidados de `TransferenciaResponse`) pueden no coincidir con los del contrato provisorio. | Solo `src/api/tipos.ts` los nombra: se corrige ese archivo al regenerar. |
| Lotes del detalle de un medicamento | `MedicamentoDetalleResponse` ya trae los lotes con stock en orden FEFO. | Se usan esos lotes en vez de pedir `GET /api/lotes?medicamentoId=`. |
| Exportación CSV | `desde` y `hasta` son obligatorios y el rango es de hasta 366 días. | El botón se deshabilita sin fechas y avisa si el rango es mayor. |
| Búsqueda de usuarios | El backend acepta `q`. | Se agrega el buscador a la lista de usuarios. |

## Notas

- `npm audit` informa vulnerabilidades moderadas en `minimatch`, que llega por typescript-eslint. Es una herramienta de desarrollo que no entra en el build. Se revisa cuando typescript-eslint actualice la dependencia.
- El `<input type="date">` muestra el formato que corresponde al idioma del navegador (en un Chrome en español, `dd/mm/aaaa`). El valor que se envía siempre es `aaaa-mm-dd`.
