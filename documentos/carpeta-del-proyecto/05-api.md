# 5. API REST

La documentación interactiva está en **Swagger UI** (perfiles `dev` y `demo`):
http://localhost:8080/swagger-ui.html. El contrato en formato OpenAPI está en
http://localhost:8080/v3/api-docs. Hay pedidos listos para probar con la extensión *REST Client* de
VS Code en `docs/api/farmacia.http`.

## 5.1 Convenciones

| Tema | Convención |
|---|---|
| Prefijo | Todas las rutas empiezan con `/api`. |
| Formato | JSON con nombres en camelCase. |
| Fechas | Día: `2026-11-30`. Instante: `2026-11-09T17:49:00-03:00`. |
| Autenticación | Cabecera `Authorization: Bearer <token>` en todo salvo login y recuperación. |
| Paginación | `page` (desde 0), `size` (20 por defecto, máximo 100), `sort=campo,asc` o `campo,desc`. Respuesta: `{ "content": [...], "page": { "number", "size", "totalElements", "totalPages" } }`. |
| Orden | Solo los campos permitidos de cada listado; otro → 400 `ORDEN_INVALIDO`. |
| Filtro `activo` | Opcional. Sin él, vienen activos e inactivos. |
| Respuestas | 200 consulta o edición; 201 creación (con cabecera `Location`); 202 aceptado (pedido de código); 204 sin cuerpo (cambios de estado y de contraseña). |
| Bajas | `PATCH /{id}/estado` con `{ "activo": false }` (o `true` para reactivar). No hay `DELETE`. |

## 5.2 Endpoints

Permiso: el que exige cada ruta (ver la matriz en [06-seguridad.md](06-seguridad.md)).

### Autenticación

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `POST /api/auth/login` | público | `{username, password}` | 200 `{token, expiraEn, usuario}` |
| `GET /api/auth/me` | con sesión | — | 200 `{id, username, nombreCompleto, rol, permisos[]}` |
| `PATCH /api/auth/me/password` | con sesión | `{passwordActual, passwordNueva}` | 204 |
| `POST /api/auth/recuperacion` | público | `{username}` | 202 `{mensaje, codigoSimulado}` (`codigoSimulado` solo en demo) |
| `POST /api/auth/recuperacion/confirmar` | público | `{username, codigo, passwordNueva}` | 204 |

### Usuarios

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `GET /api/usuarios` | USUARIO_GESTIONAR | `q`, `activo`; orden: `username`, `nombreCompleto`, `creadoEn` | Página de usuarios |
| `POST /api/usuarios` | USUARIO_GESTIONAR | `{username, nombreCompleto, rol, password}` | 201 |
| `PUT /api/usuarios/{id}` | USUARIO_GESTIONAR | `{nombreCompleto, rol}` | 200 |
| `PATCH /api/usuarios/{id}/estado` | USUARIO_GESTIONAR | `{activo}` | 204 |
| `PATCH /api/usuarios/{id}/password` | USUARIO_GESTIONAR | `{passwordNueva}` | 204 |
| `GET /api/usuarios/exportar` | USUARIO_GESTIONAR | `q`, `activo`, `formato` (sin contraseñas ni hash) | Archivo `usuarios.*` |

### Proveedores y áreas

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `GET /api/proveedores` | LECTURA | `q` (razón social o CUIT), `activo`; orden: `razonSocial` | Página con `lotesConStock` y CUIT con guiones |
| `GET /api/proveedores/{id}` | LECTURA | — | 200 |
| `POST /api/proveedores` | CATALOGO_EDITAR | `{razonSocial, cuit, telefono, email}` | 201 |
| `PUT /api/proveedores/{id}` | CATALOGO_EDITAR | ídem | 200 |
| `PATCH /api/proveedores/{id}/estado` | CATALOGO_EDITAR | `{activo}` | 204 |
| `GET /api/proveedores/exportar` | LECTURA | `q`, `activo`, `formato` | Archivo `proveedores.*` |
| `GET /api/areas` | LECTURA | `q`, `activo`; orden: `nombre` | Página |
| `POST /api/areas` · `PUT /api/areas/{id}` | CATALOGO_EDITAR | `{nombre}` | 201 / 200 |
| `PATCH /api/areas/{id}/estado` | CATALOGO_EDITAR | `{activo}` | 204 |
| `GET /api/areas/exportar` | LECTURA | `q`, `activo`, `formato` | Archivo `areas.*` |

### Medicamentos

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `GET /api/medicamentos` | LECTURA | `q` (código o nombre), `estado` (`SIN_STOCK`, `STOCK_BAJO`, `OK`), `activo`; orden: `codigo`, `nombre`, `stockTotal`, `proximoVencimiento` | Página con `stockTotal`, `estadoStock`, `proximoVencimiento` |
| `GET /api/medicamentos/exportar` | LECTURA | mismos filtros + `formato=CSV\|XLSX\|PDF` | Archivo `stock_medicamentos.*` |
| `GET /api/medicamentos/{id}` | LECTURA | — | Medicamento + `lotes` con stock en orden FEFO |
| `POST /api/medicamentos` | CATALOGO_EDITAR | `{codigo, nombre, presentacion, stockMinimo}` | 201 |
| `PUT /api/medicamentos/{id}` | CATALOGO_EDITAR | ídem | 200 |
| `PATCH /api/medicamentos/{id}/estado` | CATALOGO_EDITAR | `{activo}` | 204 (409 `MEDICAMENTO_CON_STOCK`) |

### Lotes y movimientos

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `POST /api/medicamentos/{id}/lotes` | STOCK_INGRESAR | `{proveedorId, numeroLote, fechaVencimiento, cantidad}` | 201 `{lote, stockTotalResultante}` |
| `GET /api/lotes` | LECTURA | `q` (medicamento, número de lote o proveedor), `medicamentoId`, `estado` (uno o varios: `VIGENTE`, `POR_VENCER`, `VENCIDO`, `AGOTADO`); orden: `fechaVencimiento`, `fechaIngreso` | Página con `estado` y `diasParaVencer` |
| `GET /api/lotes/exportar` | LECTURA | mismos filtros + `formato` | Archivo `lotes_vencimientos.*` |
| `POST /api/lotes/{id}/baja` | STOCK_BAJA_AJUSTE | `{motivo}` | 200 lote |
| `POST /api/lotes/{id}/ajuste` | STOCK_BAJA_AJUSTE | `{cantidadNueva, motivo}` | 200 lote |
| `GET /api/movimientos` | LECTURA | `loteId`, `medicamentoId`, `tipo`, `desde`, `hasta`; orden: `fechaHora` (desc) | Página |
| `GET /api/movimientos/exportar` | LECTURA | mismos filtros + `formato` | Archivo `movimientos_stock.*` |

### Transferencias

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `POST /api/transferencias` | TRANSFERENCIA_CREAR | `{areaId, observaciones, items: [{medicamentoId, cantidad}]}` | 201 comprobante completo |
| `GET /api/transferencias` | LECTURA | `desde`, `hasta` (inclusive), `areaId`; orden: `fechaHora` (desc) | Página con `numero`, `cantidadItems`, `unidadesTotales` |
| `GET /api/transferencias/{id}` | LECTURA | — | Comprobante |
| `GET /api/transferencias/{id}/pdf` | LECTURA | — | PDF del comprobante con lugar para firmas |
| `GET /api/transferencias/exportar` | LECTURA | `desde` y `hasta` obligatorios (máx. 366 días), `areaId`, `formato` | Archivo |

### Alertas y panel

| Método y ruta | Permiso | Respuesta |
|---|---|---|
| `GET /api/alertas` | LECTURA | `{diasPorVencer, sinStock[], stockBajo[], vencidos[], porVencer[]}` |
| `GET /api/alertas/exportar` | LECTURA | Archivo `alertas.*` (`formato=CSV\|XLSX\|PDF`) |
| `GET /api/resumen` | LECTURA | `{totales, diasPorVencer, medicamentosActivos, transferenciasHoy, ultimasTransferencias[5], egresosPorArea[]}` |

### Infraestructura

| Ruta | Para qué |
|---|---|
| `GET /actuator/health` | Estado del servicio (`UP`), sin detalles. Público. |
| `/swagger-ui.html`, `/v3/api-docs` | Documentación (solo `dev` y `demo`). |

## 5.3 Ejemplos

Login:

```http
POST /api/auth/login
Content-Type: application/json

{ "username": "farmaceutico", "password": "demo1234" }
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiraEn": "2026-11-12T22:30:00Z",
  "usuario": {
    "id": 2, "username": "farmaceutico", "nombreCompleto": "…", "rol": "FARMACEUTICO",
    "permisos": ["LECTURA", "CATALOGO_EDITAR", "STOCK_INGRESAR", "STOCK_BAJA_AJUSTE", "TRANSFERENCIA_CREAR"]
  }
}
```

Transferencia:

```http
POST /api/transferencias
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{ "areaId": 1, "observaciones": "Pedido de la mañana",
  "items": [ { "medicamentoId": 5, "cantidad": 150 } ] }
```

Respuesta 201 (el FEFO tomó dos lotes):

```json
{
  "id": 42, "numero": "TR-000042", "fechaHora": "2026-11-12T09:15:00-03:00",
  "area": { "id": 1, "nombre": "Guardia" },
  "realizadaPor": { "id": 2, "nombreCompleto": "…" },
  "observaciones": "Pedido de la mañana",
  "detalle": [
    { "medicamentoId": 5, "medicamento": "Paracetamol comprimidos 500 mg", "loteId": 10, "numeroLote": "L2301", "fechaVencimiento": "2026-12-01", "cantidad": 100 },
    { "medicamentoId": 5, "medicamento": "Paracetamol comprimidos 500 mg", "loteId": 14, "numeroLote": "L2340", "fechaVencimiento": "2027-03-15", "cantidad": 50 }
  ]
}
```

## 5.4 Errores

Formato **RFC 9457 (Problem Details)** con la propiedad extra `codigo`:

```json
{ "type": "about:blank", "title": "Datos inválidos", "status": 400,
  "detail": "Revisá los datos ingresados.", "codigo": "VALIDACION",
  "errors": { "fechaVencimiento": "La fecha de vencimiento no puede ser anterior a hoy." } }
```

| Caso | Status | `codigo` | Extra |
|---|---|---|---|
| Validación de campos | 400 | `VALIDACION` | `errors: {campo: mensaje}` |
| JSON mal formado o tipo inválido | 400 | `CUERPO_INVALIDO` | — |
| Parámetro u orden inválido | 400 | `PARAMETRO_INVALIDO`, `ORDEN_INVALIDO` | — |
| Sin sesión, token inválido o vencido, usuario inactivo | 401 | `NO_AUTENTICADO` | — |
| Sin permiso | 403 | `SIN_PERMISO` | — |
| No existe | 404 | `NO_ENCONTRADO` | — |
| Stock insuficiente | 409 | `STOCK_INSUFICIENTE` | `faltantes: [{medicamentoId, medicamento, disponible, solicitado}]` |
| Duplicados | 409 | `CODIGO_DUPLICADO`, `LOTE_DUPLICADO`, `CUIT_DUPLICADO`, `USERNAME_DUPLICADO`, `NOMBRE_DUPLICADO` | — |
| Reglas de negocio | 409 | `AREA_INACTIVA`, `PROVEEDOR_INACTIVO`, `MEDICAMENTO_INACTIVO`, `MEDICAMENTO_CON_STOCK`, `LOTE_NO_VENCIDO`, `LOTE_SIN_STOCK`, `ULTIMO_ADMIN`, `PROPIO_USUARIO` | — |
| Error inesperado | 500 | `ERROR_INTERNO` | `errorId` (también en el log del servidor) |

## 5.5 Formatos de exportación

| Formato | Detalle |
|---|---|
| CSV | UTF-8 con BOM (para que Excel muestre las tildes), separador `;`, fin de línea `\r\n`, fechas `dd/mm/aaaa HH:mm`. Valores que empiezan con `=`, `+`, `-`, `@`, tabulación o retorno de carro llevan `'` adelante (anti-inyección de fórmulas). |
| XLSX | Título, filtros aplicados, encabezado de color fijo al desplazarse, filtros de columna, anchos según el contenido, números y fechas como tipos reales. |
| PDF | Título, filtros, fecha de generación y tabla con la identidad del sistema. |
