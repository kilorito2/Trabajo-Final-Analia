# 1. Relevamiento y requisitos

## 1.1 Contexto

La farmacia de un hospital público recibe medicamentos de droguerías (proveedores) y los entrega a
las áreas del hospital. El control debe hacerse **por lote**, porque cada lote tiene su propia
fecha de vencimiento y es la unidad que se rastrea si un laboratorio retira un producto.

### Áreas del hospital (carga inicial)

Guardia, UTI, Pediatría, Neonatología, Quirófano, Internación Clínica, Internación Quirúrgica y
Consultorios Externos. Se pueden agregar, renombrar o desactivar desde el sistema.

### Situación anterior

Existía un prototipo con ocho problemas graves (detallados en el informe final, sección 2.1):
identidad falsificable, clave del token en el código, stock negativo, hash de contraseña expuesto,
registro libre, fechas como texto sin alertas, borrado en cascada y errores sin información ni
pruebas. Ninguno se puede repetir.

## 1.2 Partes interesadas y actores

| Parte interesada | Interés |
|---|---|
| Jefatura de farmacia | Que no se venza mercadería, que no falte lo crítico, tener reportes. |
| Farmacéuticos y técnicos | Registrar rápido y sin errores los ingresos y entregas. |
| Áreas del hospital | Recibir lo pedido; tener un comprobante. |
| Dirección del hospital / auditoría | Ver consumo por área y trazabilidad. |
| Área de sistemas | Instalar y mantener el sistema sin costos de licencia. |

| Actor | Rol en el sistema |
|---|---|
| Administrador/a | `ADMIN` |
| Farmacéutico/a | `FARMACEUTICO` |
| Consulta | `CONSULTA` |
| Persona sin sesión | Solo puede ingresar o recuperar su contraseña |

## 1.3 Requisitos funcionales

Prioridad: **A** = imprescindible (lo pide la consigna o el negocio no funciona sin esto),
**M** = importante.

### Acceso y usuarios

| Código | Requisito | Prioridad | Rol |
|---|---|:-:|---|
| RF01 | Iniciar sesión con usuario y contraseña. El usuario no distingue mayúsculas. | A | Todos |
| RF02 | Cerrar sesión. | A | Todos |
| RF03 | Avisar 5 minutos antes de que venza la sesión (8 h). | M | Todos |
| RF04 | Recuperar la contraseña con un código de 6 números de un solo uso, que vence a los 15 minutos (envío simulado). | A | Sin sesión |
| RF05 | Cambiar la contraseña propia indicando la actual. | A | Todos |
| RF06 | Listar usuarios con búsqueda y filtro de activos. | A | ADMIN |
| RF07 | Crear un usuario con nombre de usuario, nombre completo, rol y contraseña inicial. | A | ADMIN |
| RF08 | Editar el nombre completo y el rol de un usuario. | A | ADMIN |
| RF09 | Desactivar y reactivar usuarios (baja lógica). | A | ADMIN |
| RF10 | Restablecer la contraseña de otro usuario. | A | ADMIN |

### Catálogo

| Código | Requisito | Prioridad | Rol |
|---|---|:-:|---|
| RF11 | Listar, crear, editar, desactivar y reactivar **medicamentos** (código, nombre, presentación, stock mínimo). | A | ADMIN, FARM. (ver: todos) |
| RF12 | Ver el detalle de un medicamento con sus lotes con stock en orden FEFO y su historial de movimientos. | A | Todos |
| RF13 | Listar, crear, editar, desactivar y reactivar **proveedores** (razón social, CUIT, teléfono, correo). | A | ADMIN, FARM. (ver: todos) |
| RF14 | Listar, crear, editar, desactivar y reactivar **áreas**. | A | ADMIN, FARM. (ver: todos) |

### Stock

| Código | Requisito | Prioridad | Rol |
|---|---|:-:|---|
| RF15 | Registrar el ingreso de un lote: medicamento, proveedor, número de lote, vencimiento y cantidad. | A | ADMIN, FARM. |
| RF16 | Transferir uno o más medicamentos a un área, aplicando FEFO automáticamente. | A | ADMIN, FARM. |
| RF17 | Ver, imprimir y descargar en PDF el comprobante de una transferencia. | A | Todos |
| RF18 | Listar transferencias por rango de fechas y área. | A | Todos |
| RF19 | Listar lotes por estado (vencidos, por vencer, todos con stock). | A | Todos |
| RF20 | Dar de baja un lote vencido indicando el motivo. | A | ADMIN, FARM. |
| RF21 | Ajustar la cantidad de un lote indicando el motivo. | A | ADMIN, FARM. |
| RF22 | Consultar los movimientos de stock (ingreso, egreso, baja, ajuste). | A | Todos |

### Información

| Código | Requisito | Prioridad | Rol |
|---|---|:-:|---|
| RF23 | Ver alertas: vencidos, sin stock, por vencer (30 días) y stock bajo. | A | Todos |
| RF24 | Ver un panel con indicadores, alertas, últimas 5 transferencias y unidades entregadas por área en los últimos 30 días. | A | Todos |
| RF25 | Reporte de stock de medicamentos (en pantalla, Excel y PDF). | A | Todos |
| RF26 | Reporte de lotes y vencimientos (en pantalla, Excel y PDF). | A | Todos |
| RF27 | Reporte de transferencias a áreas (en pantalla, Excel y PDF). | A | Todos |

## 1.4 Requisitos no funcionales

| Código | Categoría | Requisito | Cómo se verifica |
|---|---|---|---|
| RNF01 | Seguridad | Contraseñas con BCrypt (costo 12), entre 8 y 72 caracteres. | `SeguridadIT`, código de `SeguridadConfig` |
| RNF02 | Seguridad | Sesión con JWT HS256 de 8 horas; clave de al menos 32 bytes por variable de entorno. | `ConfiguracionTest` |
| RNF03 | Seguridad | Permisos validados en el servidor y leídos de la base en cada pedido. | `SeguridadIT` |
| RNF04 | Seguridad | Ninguna respuesta incluye la contraseña ni su hash. | `SeguridadIT` |
| RNF05 | Integridad | El stock nunca es negativo, aun con pedidos simultáneos. | `TransferenciaConcurrenciaIT`, `LoteTest` |
| RNF06 | Integridad | Nada se borra físicamente; las claves foráneas no tienen cascada. | `ProveedorServiceTest`, `V1__esquema.sql` |
| RNF07 | Trazabilidad | Cada cambio de stock genera exactamente un movimiento por lote, con usuario y fecha. La suma de movimientos de un lote es igual a su stock. | `FlujoCompletoIT` |
| RNF08 | Exactitud | "Hoy" se calcula con la zona horaria de Buenos Aires. | `AlertaServiceTest`, `fechas.test.ts` |
| RNF09 | Usabilidad | Textos en español rioplatense; estados con palabra además de color; confirmación de acciones irreversibles. | Revisión, `Insignia.test.tsx` |
| RNF10 | Accesibilidad | WCAG 2.1 AA: contraste, teclado, foco visible, etiquetas, lectores de pantalla. | Playwright + axe en todas las pantallas |
| RNF11 | Rendimiento | Listados paginados en el servidor (20 por página, máximo 100); consultas de stock agregadas en SQL. | `MedicamentoRepositoryIT` |
| RNF12 | Disponibilidad de la interfaz | Uso cómodo a 1366×768 y usable desde 1024 px; menú colapsable en pantallas chicas. | Capturas a 1366×768 |
| RNF13 | Mantenibilidad | Arquitectura en capas, formato automático, pruebas automáticas, decisiones registradas. | `./mvnw verify`, `npm run lint` |
| RNF14 | Portabilidad | Se levanta con Docker Compose en Windows, Linux o macOS. | `docker compose up --build` |
| RNF15 | Costos | Solo software libre y gratuito. | Lista de dependencias |
| RNF16 | Tiempo de respuesta | El frontend corta un pedido a los 15 segundos y avisa. | `cliente.test.ts` |

## 1.5 Reglas de negocio

| Código | Regla |
|---|---|
| RN01 | Un lote está **vencido** si su fecha de vencimiento es anterior a hoy. El día del vencimiento todavía se puede usar. |
| RN02 | Un lote está **por vencer** si tiene stock y vence entre hoy y hoy + 30 días (ambos incluidos). El 30 es configurable (`farmacia.alertas.dias-por-vencer`). |
| RN03 | Un lote está **agotado** si su cantidad actual es 0; **vigente** en cualquier otro caso. |
| RN04 | El **stock total** de un medicamento es la suma de las cantidades de sus lotes no vencidos. |
| RN05 | Estado de stock: **Sin stock** (stock 0), **Stock bajo** (0 < stock ≤ mínimo), **OK** (stock > mínimo). Las alertas solo consideran medicamentos activos. |
| RN06 | Un lote vencido con stock genera alerta aunque el medicamento esté inactivo (la mercadería sigue en el depósito). |
| RN07 | El ingreso exige medicamento y proveedor activos, vencimiento ≥ hoy, cantidad > 0 y número de lote no repetido para ese medicamento. |
| RN08 | La transferencia exige área activa, entre 1 y 50 ítems, cantidades > 0 y medicamentos activos. Los ítems repetidos se suman. |
| RN09 | La transferencia aplica **FEFO**: vencimiento ascendente, después fecha de ingreso, después id. |
| RN10 | La transferencia es **todo o nada** e informa todos los faltantes. |
| RN11 | Un lote vencido nunca se transfiere. |
| RN12 | Una transferencia no se modifica ni se anula; un error se corrige con un ajuste. |
| RN13 | Solo se da de baja un lote vencido con stock; la baja deja el lote en 0. Motivo de 5 a 200 caracteres. |
| RN14 | El ajuste fija una cantidad nueva entre 0 y la cantidad inicial, distinta de la actual. Motivo de 5 a 200 caracteres. |
| RN15 | Un medicamento con stock no vencido no se puede desactivar. |
| RN16 | Un proveedor con lotes con stock sí se puede desactivar: sus lotes siguen disponibles, pero no se lo puede elegir en ingresos nuevos. |
| RN17 | Un área inactiva no recibe transferencias. |
| RN18 | El CUIT tiene 11 dígitos y un dígito verificador válido (pesos 5,4,3,2,7,6,5,4,3,2). |
| RN19 | Código de medicamento, CUIT, nombre de usuario y nombre de área son únicos (usuario y área sin distinguir mayúsculas). |
| RN20 | Nadie puede desactivarse a sí mismo. No se puede desactivar ni quitarle el rol al último administrador activo. |
| RN21 | El número de comprobante es `TR-` seguido del id con seis dígitos (`TR-000123`). |
| RN22 | Si no existe ningún administrador al arrancar, se crea el usuario `admin` con la contraseña de `ADMIN_PASSWORD`. |

## 1.6 Supuestos y restricciones

- El sistema se usa desde navegadores de escritorio actuales (Chrome o Edge) dentro de la red del
  hospital.
- Los usuarios no tienen correo cargado; por eso la recuperación de contraseña es simulada (el
  código se muestra en pantalla en el modo demostración) y el administrador puede restablecer
  contraseñas.
- No se registran datos de pacientes.
- La consigna exige: ABM de usuarios, login, roles, recuperación de contraseña, base SQL con
  modelo ER, PK/FK, integridad y 3FN, arquitectura en capas, manejo de errores, reportes en
  pantalla y exportables, y una mejora presupuestada. El cumplimiento punto por punto está en
  `docs/consigna.md`.
