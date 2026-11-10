# Especificación del backend

Sistema de control de stock de la farmacia de un hospital público. Este documento baja el prompt
del backend a criterios de aceptación verificables por endpoint. No agrega requisitos.

## Reglas generales

- Prefijo `/api`, JSON en camelCase, fechas ISO (`2026-11-30`, `2026-11-09T17:49:00-03:00`).
- "Hoy" sale de un `Clock` con zona `America/Argentina/Buenos_Aires`.
- Paginación: `page` (desde 0), `size` (20 por defecto, máximo 100), `sort=campo,asc|desc`.
  Respuesta `{content, page: {number, size, totalElements, totalPages}}`.
- `sort` fuera de la lista blanca del endpoint: 400 `ORDEN_INVALIDO`.
- Errores: ProblemDetail con `title`, `detail` en español y `codigo`.
- 201 con `Location` para creaciones, 204 sin cuerpo para cambios de estado y de contraseña.
- Sin token o con token inválido/vencido: 401 `NO_AUTENTICADO`. Sin permiso: 403 `SIN_PERMISO`.

## Autenticación

| Endpoint | Criterios de aceptación |
|---|---|
| `POST /api/auth/login` | Público. Credenciales correctas: 200 con `token`, `expiraEn` (+8 h) y `usuario`. Contraseña incorrecta, usuario inexistente o inactivo: 401 con el mismo `detail` "Usuario o contraseña incorrectos.". El username no distingue mayúsculas. |
| `GET /api/auth/me` | 200 con `{id, username, nombreCompleto, rol, permisos}`. Los permisos son los del rol actual en la base. |
| `PATCH /api/auth/me/password` | `passwordActual` incorrecta: 400 `VALIDACION` con `errors.passwordActual`. `passwordNueva` de 8 a 72 caracteres. Éxito: 204. |
| `POST /api/auth/recuperacion` | Público. 202 con `{mensaje, codigoSimulado}`, el mismo `mensaje` exista o no el usuario. Si existe y está activo, genera un código de 6 números que vence en 15 minutos, se guarda con hash y anula los anteriores. `codigoSimulado` solo viene con `farmacia.recuperacion.mostrar-codigo` (perfiles `demo` y `test`); si no, es `null`. |
| `POST /api/auth/recuperacion/confirmar` | Público. `{username, codigo, passwordNueva}`: código de 6 números y contraseña de 8 a 72 caracteres (400 `VALIDACION`). Código incorrecto, vencido o ya usado: 400 `VALIDACION` con `errors.codigo`. Después de 5 intentos fallidos el código se anula aunque el siguiente sea el correcto. Éxito: 204 y el código no sirve más. |

## Usuarios (`USUARIO_GESTIONAR`)

| Endpoint | Criterios de aceptación |
|---|---|
| `GET /api/usuarios` | Filtros `q` (username o nombre) y `activo`. Orden: `username`, `nombreCompleto`, `creadoEn`. Nunca incluye el hash. |
| `POST /api/usuarios` | 201. Username repetido (sin distinguir mayúsculas): 409 `USERNAME_DUPLICADO`. |
| `PUT /api/usuarios/{id}` | Cambia nombre y rol. Quitarle el rol al último ADMIN activo: 409 `ULTIMO_ADMIN`. |
| `PATCH /api/usuarios/{id}/estado` | 204. Desactivarse a sí mismo: 409 `PROPIO_USUARIO`. Desactivar al último ADMIN activo: 409 `ULTIMO_ADMIN`. Un usuario desactivado recibe 401 con su token. |
| `PATCH /api/usuarios/{id}/password` | 204. Restablece la contraseña. |

## Proveedores y áreas

| Endpoint | Criterios de aceptación |
|---|---|
| `GET /api/proveedores` (`LECTURA`) | Filtros `q` (razón social o CUIT) y `activo`. Orden: `razonSocial`. Cada uno trae `lotesConStock` y el CUIT con guiones. |
| `GET /api/proveedores/{id}` | 200 o 404 `NO_ENCONTRADO`. |
| `POST`/`PUT /api/proveedores` (`CATALOGO_EDITAR`) | CUIT con o sin guiones, dígito verificador válido (400 `VALIDACION` si no). CUIT repetido: 409 `CUIT_DUPLICADO`. |
| `PATCH /api/proveedores/{id}/estado` | 204. Se permite aunque tenga lotes con stock; esos lotes siguen disponibles. |
| `GET /api/areas` (`LECTURA`) | Filtros `q`, `activo`. Orden: `nombre`. |
| `POST`/`PUT /api/areas` (`CATALOGO_EDITAR`) | Nombre repetido sin distinguir mayúsculas: 409 `NOMBRE_DUPLICADO`. |
| `PATCH /api/areas/{id}/estado` | 204. Un área inactiva no recibe transferencias. |

## Medicamentos

| Endpoint | Criterios de aceptación |
|---|---|
| `GET /api/medicamentos` (`LECTURA`) | Filtros `q` (código o nombre), `estado` (`SIN_STOCK`, `STOCK_BAJO`, `OK`), `activo`. Orden: `codigo`, `nombre`, `stockTotal`, `proximoVencimiento`. `stockTotal` suma solo lotes no vencidos. `proximoVencimiento` es null sin lotes con stock. |
| `GET /api/medicamentos/exportar` (`LECTURA`) | Mismos filtros que el listado (`q`, `estado`, `activo`), sin paginar, ordenado por nombre. `formato=CSV` (por defecto), `XLSX` o `PDF`; otro valor: 400 `PARAMETRO_INVALIDO`. Archivo `stock_medicamentos.csv` / `.xlsx` / `.pdf`. |
| `GET /api/medicamentos/{id}` | Igual que el listado más `lotes` con stock en orden FEFO. 404 si no existe. |
| `POST`/`PUT /api/medicamentos` (`CATALOGO_EDITAR`) | `stockMinimo >= 0`. Código repetido: 409 `CODIGO_DUPLICADO`. |
| `PATCH /api/medicamentos/{id}/estado` | 204. Con stock no vencido: 409 `MEDICAMENTO_CON_STOCK`. |

## Lotes y movimientos

| Endpoint | Criterios de aceptación |
|---|---|
| `POST /api/medicamentos/{id}/lotes` (`STOCK_INGRESAR`) | Medicamento y proveedor activos (409 `MEDICAMENTO_INACTIVO` / `PROVEEDOR_INACTIVO`). `fechaVencimiento >= hoy` (400 `VALIDACION` con `errors.fechaVencimiento`). `cantidad > 0`. Número de lote repetido para ese medicamento: 409 `LOTE_DUPLICADO`. Genera un movimiento `INGRESO`. 201 con `{lote, stockTotalResultante}`. |
| `GET /api/lotes` (`LECTURA`) | Filtros `medicamentoId` y `estado` (uno o varios: `VIGENTE`, `POR_VENCER`, `VENCIDO`, `AGOTADO`). Orden: `fechaVencimiento`, `fechaIngreso`. |
| `GET /api/lotes/exportar` (`LECTURA`) | Filtros `medicamentoId` y `estado` del listado, sin paginar, ordenado por vencimiento. `formato=CSV`, `XLSX` o `PDF`. Archivo `lotes_vencimientos.csv` / `.xlsx` / `.pdf`. |
| `POST /api/lotes/{id}/baja` (`STOCK_BAJA_AJUSTE`) | Solo lotes vencidos con stock: si no venció, 409 `LOTE_NO_VENCIDO`; si está en 0, 409 `LOTE_SIN_STOCK`. Deja el lote en 0 y registra `BAJA_VENCIMIENTO` con el motivo (5 a 200 caracteres). |
| `POST /api/lotes/{id}/ajuste` (`STOCK_BAJA_AJUSTE`) | `0 <= cantidadNueva <= cantidadInicial` y distinta de la actual (400 `VALIDACION`). Motivo de 5 a 200 caracteres. Registra `AJUSTE` con la diferencia. Usa bloqueo pesimista. |
| `GET /api/movimientos` (`LECTURA`) | Filtros `loteId`, `medicamentoId`, `tipo`, `desde`, `hasta`. Orden: `fechaHora` (desc por defecto). La suma de `cantidad` de un lote es igual a su `cantidadActual`. |

## Transferencias

| Endpoint | Criterios de aceptación |
|---|---|
| `POST /api/transferencias` (`TRANSFERENCIA_CREAR`) | Entre 1 y 50 ítems, cantidades > 0, ítems repetidos se suman. Área activa (409 `AREA_INACTIVA`), medicamentos existentes y activos. FEFO por vencimiento, fecha de ingreso e id. Nunca usa lotes vencidos. Si falta stock: 409 `STOCK_INSUFICIENTE` con todos los `faltantes` y sin modificar nada. El usuario sale del token. Un `DetalleTransferencia` y un movimiento `EGRESO` por lote afectado. 201 con el comprobante. Dos pedidos simultáneos nunca dejan stock negativo ni se traban. |
| `GET /api/transferencias` (`LECTURA`) | Filtros `desde`, `hasta` (inclusive), `areaId`. Orden: `fechaHora` (desc por defecto). Cada fila trae `numero` (`TR-000123`), `cantidadItems` y `unidadesTotales`. |
| `GET /api/transferencias/{id}` | Comprobante completo o 404. |
| `GET /api/transferencias/{id}/pdf` | Comprobante en PDF con lugar para las firmas, o 404. |
| `GET /api/transferencias/exportar` | `desde` y `hasta` obligatorios, hasta 366 días (400 `PARAMETRO_INVALIDO`). `formato=CSV` (por defecto), `XLSX` o `PDF`. En CSV: `text/csv`, BOM UTF-8, separador `;`, fin de línea `\r\n`, fechas `dd/mm/aaaa HH:mm`. Una fila por línea de detalle. Valores que empiezan con `=`, `+`, `-`, `@`, tabulación o retorno de carro llevan `'` adelante. |

## Alertas y resumen (`LECTURA`)

| Endpoint | Criterios de aceptación |
|---|---|
| `GET /api/alertas` | `SIN_STOCK`: activo con stock 0. `STOCK_BAJO`: activo con 0 < stock <= mínimo. `VENCIDO`: lote con stock y vencimiento < hoy (aunque el medicamento esté inactivo). `POR_VENCER`: lote con stock y hoy <= vencimiento <= hoy + N. Vence hoy y vence en N días: `POR_VENCER`; en N+1: sin alerta. Orden: vencidos y por vencer por fecha; sin stock por nombre; stock bajo por stock/mínimo. |
| `GET /api/resumen` | Totales de cada alerta, `diasPorVencer`, medicamentos activos, transferencias de hoy, últimas 5 transferencias y egresos por área de los últimos 30 días (de mayor a menor). |

## Seguridad y configuración

- La app no arranca sin `JWT_SECRET`, con menos de 32 bytes, ni con `demo` y `prod` a la vez.
- Una cabecera `X-User-Id` (o similar) no cambia la identidad.
- Ninguna respuesta contiene `password` ni el hash.
- Swagger solo en `dev` y `demo`. Actuator expone solo `/actuator/health`, sin detalles.
