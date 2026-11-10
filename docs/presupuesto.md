# Mejora propuesta y presupuesto

> **Pendiente:** falta definir el valor hora. Los costos están expresados como
> `horas × valor hora`; cuando se defina, se completan los montos de las tablas.

**Valor hora de referencia:** _a definir_ (desarrollador semi senior, freelance, en pesos argentinos).

## 1. Sistema original

Estimación de las horas que lleva construir el sistema tal como está entregado (backend, frontend,
base de datos, reportes, tests y documentación).

| Etapa | Horas |
|---|---:|
| Relevamiento, análisis y especificación funcional | 24 |
| Diseño: modelo de datos, arquitectura y diseño visual | 28 |
| Backend: seguridad (JWT, roles, permisos), usuarios y recuperación de contraseña | 32 |
| Backend: catálogo de medicamentos, proveedores y áreas | 24 |
| Backend: lotes, ingresos, bajas por vencimiento, ajustes y movimientos | 28 |
| Backend: transferencias FEFO con bloqueo y control de concurrencia | 32 |
| Backend: alertas, panel y reportes en CSV y PDF | 28 |
| Backend: tests unitarios y de integración (Testcontainers) | 32 |
| Frontend: estructura, componentes reutilizables y diseño visual | 36 |
| Frontend: ingreso, recuperación de contraseña, mi cuenta y usuarios | 20 |
| Frontend: medicamentos, proveedores, áreas, lotes e ingresos | 40 |
| Frontend: transferencias, comprobante, panel y reportes | 40 |
| Frontend: tests y accesibilidad (WCAG AA) | 24 |
| Integración, Docker y puesta en marcha | 16 |
| Documentación y capacitación de usuarios | 16 |
| Gestión del proyecto y pruebas de aceptación | 24 |
| **Total** | **444** |

**Costo del sistema original:** 444 h × valor hora.

## 2. Mejora propuesta: órdenes de compra y reposición automática

### Problema

El sistema avisa cuando un medicamento tiene stock bajo o se queda sin stock, pero el pedido al
proveedor se hace por fuera (teléfono, correo o planilla). No queda registro de qué se pidió,
cuándo ni a quién, y cuando llega la mercadería el ingreso no se puede vincular con el pedido.
Tampoco se sabe qué proveedores cumplen los plazos.

### Propuesta

Un módulo de **órdenes de compra** integrado con el stock:

1. **Sugerencia automática.** Para cada medicamento con stock bajo o sin stock, el sistema propone
   una cantidad a pedir: consumo promedio diario de los últimos 90 días (calculado con los egresos
   ya registrados) × días de cobertura configurables − stock disponible, con el stock mínimo como
   piso. Las sugerencias se agrupan por el último proveedor que entregó cada medicamento.
2. **Flujo de aprobación.** Borrador → Aprobada (solo ADMIN) → Enviada → Recibida parcial o total
   (o Anulada). Cada cambio de estado queda registrado con usuario y fecha.
3. **Orden en PDF y envío al proveedor** por correo, con el mismo formato de los reportes actuales.
4. **Recepción vinculada.** Al registrar un ingreso de mercadería se elige la orden; el sistema
   descuenta lo pendiente y cierra la orden cuando se recibe todo.
5. **Reportes nuevos:** órdenes pendientes y cumplimiento de proveedores (días entre el envío y la
   recepción, porcentaje entregado), en pantalla, CSV y PDF.

### Cambios en el modelo de datos (sigue en 3FN)

- `orden_compra` (id, proveedor_id FK, estado, creada_por_id FK, aprobada_por_id FK, creada_en,
  enviada_en, observaciones).
- `detalle_orden_compra` (id, orden_compra_id FK, medicamento_id FK, cantidad_pedida), con
  `unique (orden_compra_id, medicamento_id)` y `check (cantidad_pedida > 0)`.
- `lote.detalle_orden_compra_id` FK opcional: la cantidad recibida se calcula sumando los lotes
  vinculados, no se guarda.

### Estimación

| Tarea | Horas |
|---|---:|
| Análisis, casos de uso y diseño del modelo (migración `V4`) | 10 |
| Backend: entidades, servicios y estados de la orden | 18 |
| Backend: cálculo de sugerencias por consumo promedio | 10 |
| Backend: vínculo de los ingresos con la orden y recepción parcial | 8 |
| Backend: PDF de la orden y envío por correo (SMTP) | 10 |
| Backend: permisos y tests de integración | 14 |
| Frontend: listado de órdenes con filtros | 8 |
| Frontend: armado y edición de la orden con las sugerencias | 14 |
| Frontend: aprobación, envío y recepción | 8 |
| Frontend: reportes nuevos, tests y accesibilidad | 8 |
| Documentación, pruebas de aceptación y capacitación | 8 |
| **Subtotal** | **116** |
| Contingencia (10 %) por integración con el correo del hospital | 12 |
| **Total de la mejora** | **128** |

**Costo de la mejora:** 128 h × valor hora.

## 3. Presupuesto total

| Concepto | Horas | Costo |
|---|---:|---:|
| Sistema original | 444 | 444 × valor hora |
| Mejora: órdenes de compra y reposición | 128 | 128 × valor hora |
| **Total** | **572** | **572 × valor hora** |

### Condiciones

- Todo el software usado es libre y gratuito (Java, Spring Boot, PostgreSQL, React, Docker,
  OpenPDF): no hay costo de licencias.
- No incluye hardware ni hosting: el sistema corre con Docker en un servidor del hospital.
- La mejora necesita una cuenta de correo SMTP del hospital para enviar las órdenes.
- Forma de pago sugerida: 40 % al inicio, 30 % al entregar el backend y 30 % a la aceptación final.
