# Cumplimiento de la consigna del TFI

Cada requisito obligatorio, dónde está resuelto y cómo se verifica.

## Gestión de usuarios

| Requisito | Dónde | Cómo se verifica |
|---|---|---|
| ABM de usuarios | `POST/PUT /api/usuarios`, `PATCH /api/usuarios/{id}/estado` (baja lógica). Pantalla **Usuarios**. | `crearUsuario` y `desactivarUsuario` en los tests de integración; captura `13-usuarios`. |
| Login con validación de credenciales | `POST /api/auth/login`: BCrypt, la misma respuesta para usuario inexistente, inactivo o contraseña incorrecta. Token JWT de 8 h. | `SeguridadIT`, `PaginaIngreso.test.tsx`. |
| Roles (mínimo Administrador y Usuario) | Tres roles: **ADMIN**, **FARMACEUTICO** y **CONSULTA**, con permisos por rol (`Permiso`, `PermisosDeUsuario`). El rol se lee de la base en cada pedido. | El menú y las rutas cambian según los permisos (`RutaProtegida`); 403 `SIN_PERMISO` en el backend. |
| Recuperación de contraseña (real o simulada) | **Simulada**: "¿Olvidaste tu contraseña?" en el ingreso → `/recuperar`. `POST /api/auth/recuperacion` genera un código de 6 números (vence en 15 min, se guarda con hash, 5 intentos); el "correo" se simula mostrando el código en pantalla. `POST /api/auth/recuperacion/confirmar` crea la contraseña nueva. El administrador también puede restablecerla desde **Usuarios**. | `RecuperacionIT`, `RecuperacionPasswordTest`, `PaginaRecuperacion.test.tsx`; captura `00-recuperar-contrasena`. |

## Persistencia de datos

| Requisito | Dónde |
|---|---|
| Base de datos SQL | PostgreSQL 16, migraciones Flyway. |
| Modelo entidad-relación explícito | Diagrama en [`modelo-datos.md`](modelo-datos.md). |
| Claves primarias y foráneas bien definidas | Todas declaradas en `V1__esquema.sql` y `V3__recuperacion_password.sql`; tabla de relaciones en `modelo-datos.md`. |
| Validaciones de integridad | `CHECK`, `UNIQUE` y `NOT NULL` en la base, invariantes en las entidades y Bean Validation en los DTO (detalle en `modelo-datos.md`). |
| Normalizada hasta 3FN | Justificación tabla por tabla en `modelo-datos.md`. |

## Calidad de código

| Requisito | Dónde |
|---|---|
| Arquitectura con separación de responsabilidades | Backend en capas por funcionalidad: Controller (sin lógica) → Service (`@Transactional`) → Repository → Entidad, con DTO `record`. Frontend: `api/` (único lugar que llama a `fetch`), `hooks/`, `components/` reutilizables y `pages/`. |
| Código modular y reutilizable | Ejemplos: `Reporte` + `Exportador` generan CSV y PDF para todos los reportes; `Tabla`, `CampoFormulario`, `useFormulario` y `useDescarga` en el front. |
| Manejo de errores y excepciones | `ManejadorErrores`: todo error sale como ProblemDetail con `codigo`; el 500 tiene `errorId` y no expone el stacktrace. El front muestra los errores debajo de cada campo o como aviso. |
| Código ordenado y claro | Spotless + google-java-format en `verify`; ESLint, Prettier, TypeScript estricto y knip en el front. 100 tests en el backend y 99 en el front. |

## Reportes (excluyente)

| Requisito | Dónde |
|---|---|
| Mostrar la información en pantalla | Panel con indicadores y alertas, listados de medicamentos, lotes y transferencias con filtros, y la pantalla **Reportes** con "Ver en pantalla". |
| Exportar a PDF, Excel o CSV | Pantalla **Reportes**: stock de medicamentos, lotes y vencimientos, transferencias y alertas, cada uno en **Excel (.xlsx)** y **PDF** (y CSV por la API). Además, botones **Excel** y **PDF** con los filtros aplicados en el Panel (alertas), Medicamentos, el detalle de cada medicamento (movimientos de stock), Lotes y vencimientos, Transferencias, Proveedores, Áreas y Usuarios. Cada comprobante se descarga en PDF con lugar para las firmas. |

Endpoints: `GET /api/medicamentos/exportar`, `GET /api/lotes/exportar`,
`GET /api/transferencias/exportar`, `GET /api/movimientos/exportar`, `GET /api/proveedores/exportar`,
`GET /api/areas/exportar`, `GET /api/usuarios/exportar` y `GET /api/alertas/exportar` (todos con
`formato=CSV|XLSX|PDF`) y `GET /api/transferencias/{id}/pdf`. Tests: `ReportesIT`, `ExportacionesIT`,
`FlujoCompletoIT`, `PaginaReportes.test.tsx`, `BotonesExportar.test.tsx`.

## Mejora y presupuesto

En [`presupuesto.md`](presupuesto.md): mejora propuesta (órdenes de compra y reposición
automática), horas estimadas, costo del sistema original, costo de la ampliación y presupuesto
total.
