# 10. Glosario

Términos del negocio y técnicos que aparecen en la documentación. Para explicaciones más largas,
desde cero, ver [`../estudio/16-glosario.md`](../estudio/16-glosario.md).

## Del negocio

| Término | Significado |
|---|---|
| **Ajuste** | Corrección de la cantidad de un lote cuando el conteo físico no coincide (rotura, pérdida, error). Requiere motivo. |
| **Área** | Servicio del hospital que recibe medicamentos (Guardia, UTI, Pediatría…). |
| **Baja lógica** | Marcar un registro como inactivo (`activo = false`) en lugar de borrarlo. Se puede reactivar y no se pierde el historial. |
| **Baja por vencimiento** | Retiro del stock de un lote vencido. Lo deja en 0 y registra el motivo. |
| **Comprobante** | Documento de una transferencia (`TR-000123`) con el detalle por lote y lugar para firmas. |
| **CUIT** | Clave Única de Identificación Tributaria (11 dígitos, el último es verificador). |
| **Egreso** | Salida de stock de un lote por una transferencia. |
| **FEFO** | *First Expired, First Out*: sale primero lo que vence primero. |
| **FIFO** | *First In, First Out*: sale primero lo que entró primero. No se usa: con medicamentos puede dejar vencer un lote. |
| **Ingreso de mercadería** | Registro de un lote recibido de un proveedor. |
| **Lote** | Partida de un medicamento con un número y una fecha de vencimiento. Unidad de trazabilidad. |
| **Movimiento de stock** | Registro de cada cambio de cantidad de un lote: ingreso, egreso, baja o ajuste. |
| **Por vencer** | Lote con stock que vence entre hoy y dentro de 30 días. |
| **Presentación** | Forma y concentración del medicamento (comprimidos 500 mg, frasco ampolla 1 g). |
| **Proveedor** | Droguería o laboratorio que entrega la mercadería. |
| **Stock bajo** | Medicamento con stock mayor a 0 y menor o igual a su stock mínimo. |
| **Stock mínimo** | Cantidad por debajo de la cual hay que reponer. |
| **Stock total** | Suma de las cantidades de los lotes no vencidos de un medicamento. |
| **Transferencia** | Entrega de medicamentos de la farmacia a un área. |
| **Trazabilidad** | Poder reconstruir el recorrido de cada unidad: de qué proveedor y lote vino, a qué área fue, quién lo registró y cuándo. |
| **Vencido** | Lote cuya fecha de vencimiento es anterior a hoy. |

## Técnicos

| Término | Significado |
|---|---|
| **API REST** | Interfaz para que dos programas se comuniquen por HTTP usando URLs para los recursos y métodos (GET, POST, PUT, PATCH) para las operaciones. |
| **BCrypt** | Algoritmo para guardar contraseñas como un hash lento e irreversible. |
| **Bloqueo pesimista** | Reservar filas de la base (`SELECT … FOR UPDATE`) para que nadie más las modifique hasta terminar la transacción. |
| **Clave foránea (FK)** | Columna que apunta a la clave primaria de otra tabla. |
| **Clave primaria (PK)** | Columna que identifica de forma única cada fila. |
| **Contenedor (Docker)** | Paquete con un programa y todo lo que necesita para correr, aislado del resto del sistema. |
| **CORS** | Regla del navegador que impide que una página llame a un servidor de otro origen si este no lo autoriza. |
| **CSP** | *Content Security Policy*: cabecera que le dice al navegador de dónde puede cargar scripts y estilos. |
| **CSRF** | Ataque que aprovecha que el navegador manda cookies solo. No aplica a esta API (usa tokens en cabeceras). |
| **Deadlock** | Dos transacciones que se esperan mutuamente y quedan trabadas. |
| **DTO** | Objeto con los datos que entran o salen por la API. |
| **Endpoint** | Una ruta de la API con un método (por ejemplo `POST /api/transferencias`). |
| **Entidad** | Clase Java que representa una tabla. |
| **Flyway** | Herramienta que aplica los scripts de la base en orden y registra cuáles ya se aplicaron. |
| **Hash** | Resultado de una función que transforma un dato en otro de forma irreversible. |
| **JPA / Hibernate** | Estándar y biblioteca para trabajar con tablas como si fueran objetos Java. |
| **JWT** | *JSON Web Token*: token firmado que identifica al usuario en cada pedido. |
| **Migración** | Script versionado que cambia el esquema de la base (`V1__esquema.sql`). |
| **Normalización (3FN)** | Organización de las tablas para evitar datos repetidos y contradicciones. |
| **OpenAPI / Swagger** | Formato estándar para describir una API y herramienta para probarla desde el navegador. |
| **ProblemDetail** | Formato estándar de errores HTTP (RFC 9457). |
| **Perfil (Spring)** | Conjunto de configuración que se activa según el entorno (`dev`, `demo`, `prod`). |
| **SPA** | *Single Page Application*: la página se carga una vez y después cambia sin recargar. |
| **Testcontainers** | Biblioteca que levanta una base real en Docker durante las pruebas. |
| **Transacción** | Grupo de operaciones que se aplican todas o ninguna. |
| **WCAG** | Pautas internacionales de accesibilidad web. |
