# Spec — Frontend de la Farmacia Hospitalaria

Fuentes: `Front_v2.md` (requisitos del front) y `Back_v2.md` §8–9 (contrato de la API). Si esta spec y el contrato no coinciden, manda el contrato; la diferencia se anota en `docs/decisiones.md` (sección Frontend) y se avisa.

## Supuestos

1. El backend expone el OpenAPI en `http://localhost:8080/v3/api-docs` (perfiles `dev`/`demo`). Hasta que exista, solo se construye lo que no depende de sus tipos (rebanadas 1 y 3, utilidades y cliente de API).
2. Los nombres de los schemas generados (`MedicamentoResponse`, `PagedModel…`) pueden diferir de los de §8.3; `src/api/tipos.ts` es la única capa que los nombra.
3. El front vive en `frontend/` y sus decisiones en `docs/decisiones.md` (sección Frontend).
4. Navegadores de escritorio actuales (Chrome/Edge) en Windows. Resolución objetivo 1366×768; mínimo usable 1024 px.

## Objetivo

Interfaz para el personal de farmacia de un hospital público: controlar stock por lote, registrar ingresos, transferir a áreas con FEFO (lo resuelve el back), ver vencimientos y alertas. Sobria, rápida de leer y difícil de usar mal. Éxito = las pantallas de §8 de `Front_v2.md` cumplen los criterios de abajo y el checklist final está en verde.

## Stack

Node ≥ 22.22 (desarrollo con 24 LTS) · React 19.2 · Vite 8 · TypeScript strict · React Router 8 (`react-router`, `createBrowserRouter`, sin loaders) · TanStack Query 5 · lucide-react · @fontsource/ibm-plex-sans (400 y 600) · CSS propio con custom properties.
Desarrollo: Vitest + Testing Library + jsdom · ESLint flat + typescript-eslint + react-hooks + jsx-a11y · Prettier · knip · openapi-typescript · Playwright + @axe-core/playwright.
Prohibido: Bootstrap, Tailwind, plantillas, librerías de componentes, jQuery, axios, moment/dayjs, Chart.js, SheetJS, librerías de formularios, Redux/Zustand.

## Comandos (desde `frontend/`)

| Script | Comando |
|---|---|
| Desarrollo | `npm run dev` (proxy `/api` → `http://localhost:8080`) |
| Build | `npm run build` (`tsc -b && vite build`) |
| Vista previa | `npm run preview` |
| Lint | `npm run lint` (`eslint . --max-warnings 0`) |
| Formato | `npm run format` (`prettier --write .`) |
| Tipos | `npm run typecheck` (`tsc -b --noEmit`) |
| Tests | `npm test` (`vitest run`) |
| Código sin usar | `npm run knip` |
| Tipos de la API | `npm run api:tipos` (`openapi-typescript http://localhost:8080/v3/api-docs -o src/api/esquema.ts`) |
| Capturas | `npm run capturas` (`playwright test`) |

## Estructura

Según `Front_v2.md` §4. Los tests van junto al archivo que prueban (`cuit.ts` → `cuit.test.ts`); los e2e en `frontend/e2e/`.

## Estilo de código

```tsx
// Nombres de dominio en español, props tipadas, sin any ni "as" para callar errores.
type PropsInsignia = { estado: EstadoStock };

export function InsigniaStock({ estado }: PropsInsignia) {
  const { texto, tono } = describirEstadoStock(estado);
  return <span className={`insignia insignia--${tono}`}>{texto}</span>;
}
```

- Un único `fetch` (en `src/api/cliente.ts`). Hooks de TanStack Query por recurso en `src/api/<recurso>.ts`.
- Comentarios solo para decisiones no obvias (fechas sin `new Date`, `sessionStorage`, cliente desacoplado del router).
- Conventional Commits con descripción en español: `feat(transferencia): sumar ítems repetidos en la misma línea`.

## Criterios de aceptación

### Transversales (T)

- **T1** Cada página tiene `<title>` "<Página> · Farmacia" y un encabezado con el título y las acciones a la derecha.
- **T2** Cada consulta tiene estado de carga (esqueleto en tablas), vacío (texto útil) y error (mensaje y botón "Reintentar").
- **T3** Filtros, orden y página viven en la URL: refrescar o usar Atrás conserva la vista.
- **T4** Todo se puede usar con teclado; el foco se ve siempre (outline de 2 px con `--color-foco`); hay un enlace "Saltar al contenido".
- **T5** Los modales son `<dialog>` con `showModal()`, tienen `aria-labelledby`, cierran con Escape y devuelven el foco al disparador.
- **T6** Los campos tienen `label`; los errores van vinculados con `aria-describedby` y `aria-invalid`; los obligatorios dicen "obligatorio" en texto.
- **T7** Las insignias de estado siempre tienen una palabra ("Vencido", "Por vencer", "Sin stock", "Stock bajo", "OK"), nunca solo color.
- **T8** Los números van con `Intl` `es-AR` y alineados a la derecha con `tabular-nums`. Un `LocalDate` `"2026-11-30"` se ve como `30/11/2026` y nunca pasa por `new Date`. Los instantes se ven en hora de Buenos Aires.
- **T9** Los avisos aparecen abajo a la derecha: los de éxito con `role="status"` (se cierran a los 5 s) y los de error con `role="alert"` (quedan hasta que se cierran).
- **T10** No hay `innerHTML`, `dangerouslySetInnerHTML`, `alert`, `confirm`, `prompt` ni `console.*` (ESLint lo impide). Un medicamento llamado `<img src=x onerror=alert(1)>` se muestra como texto.
- **T11** Textos en español rioplatense con voseo y tildes; siempre "Medicamento", "Lote", "Área", "Proveedor" y "Transferencia"; `<html lang="es-AR">`.
- **T12** A 1366×768 la tabla de medicamentos no tiene scroll horizontal. Debajo de 1024 px el menú se colapsa en un botón "Menú" con `aria-expanded`.
- **T13** Solo hay transiciones de 150 ms en hover y foco, y ninguna con `prefers-reduced-motion: reduce`.

### Cliente de API y sesión (C)

- **C1** `cliente.ts` es el único archivo con `fetch`. Las rutas empiezan con `/api/` y la base es `VITE_API_URL ?? ''`.
- **C2** Manda `Authorization: Bearer` si hay sesión y nunca una cabecera o campo de id de usuario. `Accept: application/json` siempre; `Content-Type` solo con cuerpo.
- **C3** Un 401 fuera del login borra la sesión y llama a `alExpirarSesion` (→ `/ingresar?motivo=expirada`). Un 401 en el login devuelve el error.
- **C4** Un 403 muestra "No tenés permiso para esta acción." sin cerrar la sesión y refresca `/api/auth/me`.
- **C5** 400/404/409 lanzan `ErrorApi` con el `ProblemDetail` (`codigo`, `detail`, `errors`, `faltantes`). 5xx: "Ocurrió un error en el servidor. Código: {errorId}." Error de red: "No se pudo conectar con el servidor." 15 s sin respuesta: "El servidor tardó demasiado en responder." Un 204 devuelve `undefined`.
- **C6** `descargar()` baja el CSV con el nombre de `Content-Disposition` y libera la URL del Blob.
- **C7** TanStack Query: `staleTime` 30 s; `retry` como máximo 1 y solo en consultas con error de red o 5xx; cada mutación invalida lo que afecta.
- **C8** La sesión `{token, expiraEn, usuario}` vive en `sessionStorage`. Al iniciar se valida con `/api/auth/me` mostrando una pantalla de carga (el login no parpadea).
- **C9** Un único `setTimeout` a `expiraEn − 5 min` muestra un aviso fijo: "Tu sesión vence a las HH:MM. Guardá lo que estés cargando." No hay chequeos periódicos.
- **C10** "Salir" borra la sesión y llama a `queryClient.clear()`.

### Permisos (P)

- **P1** `puede(permiso)` lee `usuario.permisos`; ninguna pantalla compara roles.
- **P2** Sin sesión, una ruta protegida lleva a `/ingresar` y, después de ingresar, vuelve a la ruta pedida. Sin permiso lleva a `/sin-permiso`.
- **P3** Rutas: `/usuarios` → `USUARIO_GESTIONAR`; `/ingresos/nuevo` → `STOCK_INGRESAR`; `/transferencias/nueva` → `TRANSFERENCIA_CREAR`; altas y ediciones de catálogo → `CATALOGO_EDITAR`; baja y ajuste de lotes → `STOCK_BAJA_AJUSTE`; el resto → `LECTURA`.
- **P4** Un usuario CONSULTA no ve ningún botón de alta, edición o baja, y si escribe la URL ve "Sin permiso".

### Pantallas (S)

- **S1 Ingreso** `/ingresar`: foco inicial en Usuario; Enter envía; mientras envía, el botón dice "Ingresando…" y está deshabilitado; credenciales inválidas → "Usuario o contraseña incorrectos." en `role="alert"`; con `?motivo=expirada` → "Tu sesión expiró. Volvé a ingresar."; sin "recordarme" ni "registrarse".
- **S2 Panel** `/`: cuatro indicadores (Vencidos, Sin stock, Por vencer (N días) con N = `diasPorVencer`, Stock bajo), cada uno con número, etiqueta y color de estado, y enlace a la lista filtrada. Alertas en orden vencidos → sin stock → por vencer → stock bajo, hasta 10 por grupo y "Ver todos". Últimas 5 transferencias. Tabla de unidades por área (30 días) con barra CSS proporcional `aria-hidden` y el número escrito. Sin alertas: "No hay alertas. El stock y los vencimientos están en orden."
- **S3 Medicamentos** lista: columnas código, nombre, presentación, stock total, stock mínimo, próximo vencimiento y estado. Búsqueda con 300 ms de espera, filtro por estado, "Incluir inactivos" (sin marcar → `activo=true`), orden solo por código, nombre, stock total y próximo vencimiento con `aria-sort`, y paginación del servidor (se muestra desde 1).
- **S4 Medicamento** alta y edición (página propia): validación al salir del campo y al enviar; los errores del servidor van debajo de cada campo y el `detail` arriba.
- **S5 Medicamento** detalle: datos, lotes con stock (número, proveedor, vencimiento, cantidad y estado, de `MedicamentoDetalleResponse.lotes`), movimientos paginados (fecha, tipo, cantidad con signo, saldo, usuario y motivo o transferencia) y acciones según permisos (Editar, Registrar ingreso, Dar de baja o Reactivar). La baja confirma en un modal con el nombre; con `MEDICAMENTO_CON_STOCK` el modal muestra el `detail`.
- **S6 Ingreso de mercadería** `/ingresos/nuevo`: medicamento (buscador, solo activos, o ya elegido si se viene del detalle), proveedor activo, número de lote, vencimiento (`min` = hoy y validado al enviar) y cantidad > 0. Si vence dentro de `diasPorVencer` días, avisa sin bloquear. Al guardar: "Se registró el lote L2345. Stock de <medicamento>: 340." y "Registrar otro lote" conserva el proveedor.
- **S7 Nueva transferencia** `/transferencias/nueva`: área activa obligatoria; ítems con `BuscadorMedicamento` (combobox ARIA: flechas, Enter, Escape) que muestran el stock disponible; cantidad entera > 0 y ≤ stock; un medicamento repetido se suma a su línea con el aviso "Se sumó a la línea de <medicamento>."; líneas editables y quitables; observaciones ≤ 500; borrador en `sessionStorage` hasta confirmar o descartar; resumen en modal con el stock que va a quedar; "Registrando…" sin doble envío; éxito → comprobante. Un 409 `STOCK_INSUFICIENTE` cierra el resumen, marca cada línea con "Disponible: X (pediste Y)", actualiza el stock y conserva todo.
- **S8 Comprobante** `/transferencias/:id`: número, fecha y hora, área, quién la hizo, observaciones y detalle por lote. "Imprimir" muestra solo el comprobante, legible en blanco y negro, con espacio para la firma de quien entrega y de quien recibe.
- **S9 Historial** `/transferencias`: filtros de fechas (por defecto los últimos 30 días) y área; columnas número (enlace), fecha y hora, área, usuario, ítems y unidades. "Exportar a Excel" baja el CSV con los mismos filtros; se deshabilita sin fechas y avisa si el rango supera 366 días.
- **S10 Lotes** `/lotes`: filtro Vencidos / Por vencer / Todos con stock; columnas medicamento, lote, proveedor, vencimiento, días ("Vence en N días" / "Venció hace N días"), cantidad y estado. "Dar de baja por vencimiento" solo en vencidos y con permiso (motivo obligatorio). "Ajustar" con permiso (cantidad nueva de 0 a la inicial, distinta de la actual, y motivo de 5 a 200 caracteres).
- **S11 Proveedores**: ABM; CUIT con máscara `XX-XXXXXXXX-X`, mostrado siempre así y validado con los vectores del back. Baja y reactivación con confirmación; si `lotesConStock > 0`, se avisa "Tiene N lotes con stock. Van a seguir disponibles, pero no vas a poder elegir este proveedor en ingresos nuevos."
- **S12 Áreas**: ABM de nombre, con baja y reactivación confirmadas.
- **S13 Usuarios** (`USUARIO_GESTIONAR`): búsqueda; columnas usuario, nombre, rol, estado y fecha de alta; alta con rol y contraseña inicial; edición de nombre y rol; activar o desactivar (no se ofrece sobre uno mismo); restablecer contraseña en modal con confirmación.
- **S14 Mi cuenta** `/cuenta`: datos del usuario y cambio de contraseña (actual, nueva y repetir, de 8 a 72 caracteres).
- **S15** `/sin-permiso`: "No tenés permiso para ver esta página." con enlace al panel. Ruta inexistente: "No encontramos esta página."

## Testing

Vitest con jsdom; `fetch` reemplazado por `vi.fn()`. Mínimos de `Front_v2.md` §12: `cliente.test.ts`, `estadoStock.test.ts`, `Insignia.test.tsx`, `fechas.test.ts`, `cuit.test.ts`, `NuevaTransferencia.test.tsx`, `RutaProtegida.test.tsx` y `seguridad.test.tsx`. Primero el test en rojo para el cliente de API y la nueva transferencia. Los e2e de Playwright (`e2e/capturas.spec.ts`) no corren con `npm test`: capturan cada pantalla a 1366×768 y fallan con violaciones axe serias o críticas.

## Límites

- **Siempre:** lint, typecheck, test y build en verde antes de cada commit; tipos de la API desde el OpenAPI; trabajar dentro de `frontend/` (y `docs/` solo con archivos `-frontend`).
- **Preguntar antes:** sumar una dependencia que no esté en el stack; tocar archivos de la raíz del monorepo (compose, CI, `docs/decisiones.md`); pushear o abrir un PR; cualquier diferencia con el contrato.
- **Nunca:** escribir a mano tipos que estén en el esquema; inventar o calcular en el front datos que deberían venir del back; usar `innerHTML` ni diálogos nativos; saltear o borrar tests en rojo; guardar el token fuera de `sessionStorage` o ponerlo en URLs o logs.

## Éxito

Checklist de `Front_v2.md` §15 en verde, más T1–T13, C1–C10, P1–P4 y S1–S15 verificados en el navegador a 1366×768 y a 1024 px.

## Preguntas abiertas

1. `MovimientoResponse` no trae el número de transferencia (`TR-000123`), solo `transferenciaId`. Propuesta: que el back agregue `transferenciaNumero`.
