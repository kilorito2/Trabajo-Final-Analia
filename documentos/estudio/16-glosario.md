# 16 — Glosario (A a Z)

Explicaciones cortas, sin jerga. Entre paréntesis, el archivo de esta carpeta donde se explica más.

**ACID** — Propiedades de una transacción: Atomicidad (todo o nada), Consistencia (respeta las
reglas), Aislamiento (no se pisan), Durabilidad (lo confirmado queda). (04)

**Actuator** — Módulo de Spring que expone datos de monitoreo. Acá solo `/actuator/health`. (06)

**Ajuste** — Corrección de la cantidad de un lote con un motivo. (09)

**Anotación** — Etiqueta `@Algo` en Java que otro programa lee para actuar (`@Entity`, `@Service`). (05)

**API** — Conjunto de operaciones que un programa ofrece a otro. (03)

**async / await** — Forma de esperar algo que tarda (un pedido HTTP) sin congelar la pantalla. (10)

**Autenticación / autorización** — Quién sos / qué podés hacer. (08)

**axe** — Herramienta que revisa automáticamente la accesibilidad de una página. (14)

**Backend** — El servidor: reglas, seguridad, datos. Acá, Java + Spring Boot. (01)

**Baja lógica** — Desactivar (`activo = false`) en vez de borrar. (04)

**BCrypt** — Algoritmo de hash lento y con sal para guardar contraseñas. (08)

**Bean** — Objeto que Spring crea y administra. (06)

**BEM** — Convención de nombres CSS: `bloque__elemento--variante`. (12)

**Bloqueo pesimista** — Reservar filas (`SELECT … FOR UPDATE`) para que nadie más las cambie hasta
terminar. (04, 09)

**BOM (Maven)** — Lista de versiones compatibles que provee Spring Boot. (15)

**BOM (UTF-8)** — Marca al principio de un CSV para que Excel reconozca las tildes. (05 de la carpeta del proyecto)

**Caché** — Copia guardada de datos para no pedirlos de nuevo. TanStack Query guarda las respuestas. (11)

**CHECK** — Restricción de la base que exige una condición (`cantidad_actual >= 0`). (04)

**CI (integración continua)** — Compilar y probar automáticamente cada cambio subido. (13)

**Clase / objeto** — Molde / cosa hecha con el molde. (02)

**Clave foránea (FK)** — Columna que apunta al id de otra tabla. (04)

**Clave primaria (PK)** — Columna que identifica cada fila. (04)

**Cliente / servidor** — El que pide / el que responde. (03)

**Clock** — Objeto del que se saca la fecha y hora actual; configurado con la zona de Argentina. (05, 09)

**Código de estado HTTP** — Número que dice cómo salió un pedido (200, 201, 400, 401, 403, 404, 409, 500). (03)

**Combobox** — Campo de texto con lista desplegable de sugerencias (buscador de medicamentos). (12)

**Commit** — Foto del código guardada en git con un mensaje. (15)

**Componente (React)** — Función que devuelve un pedazo de pantalla. (11)

**Concurrencia** — Varias operaciones al mismo tiempo. (04, 09)

**Condición de carrera** — Error que aparece cuando dos operaciones simultáneas leen y escriben el
mismo dato. (04)

**Contenedor (Docker)** — Programa empaquetado con todo lo que necesita, corriendo aislado. (13)

**Contexto (React)** — Datos compartidos por toda la app sin pasarlos por props. (11)

**Controlador** — Clase que recibe pedidos HTTP y llama al servicio. (06)

**CORS** — Regla del navegador sobre pedidos a otros orígenes. (03, 08)

**CSP** — Cabecera que le dice al navegador de dónde puede cargar scripts. (08)

**CSRF** — Ataque que aprovecha cookies; no aplica a esta API. (08)

**CSS** — Lenguaje de estilos (colores, tamaños, posiciones). (12)

**CUIT** — Identificación tributaria de 11 dígitos con dígito verificador. (09)

**Deadlock** — Dos transacciones que se esperan mutuamente para siempre. (04, 09)

**Debounce** — Esperar a que la persona deje de escribir (300 ms) antes de buscar. (12)

**Dependencia** — Biblioteca que usa el proyecto, o clase que otra necesita. (06, 15)

**Detalle de transferencia** — Renglón: de qué lote salió cuánto. (04)

**Docker Compose** — Levantar varios contenedores con un archivo. (13)

**Dockerfile** — Receta para construir una imagen. (13)

**DTO** — Objeto con los datos que entran o salen por la API. (06, 07)

**e2e (punta a punta)** — Prueba del sistema completo en un navegador. (14)

**Encapsulamiento** — Proteger los datos de un objeto para que solo cambien por sus métodos. (02)

**Endpoint** — Un método HTTP + una ruta (`POST /api/transferencias`). (03)

**Entidad** — Clase Java que representa una tabla. (06)

**Enum** — Tipo con una lista cerrada de valores (`Rol`, `Permiso`). (05)

**Excepción** — Error que corta la ejecución y sube hasta que alguien lo maneja. (02)

**FEFO** — Primero vence, primero sale. (09)

**fetch** — Función del navegador para hacer pedidos HTTP. (10)

**Flyway** — Aplica las migraciones `.sql` en orden. (04)

**Framework** — Esqueleto de aplicación ya armado (Spring Boot). (06)

**Frontend** — Las pantallas en el navegador. Acá, React + TypeScript. (01)

**Genéricos** — `<T>`: el tipo de los elementos (`List<Lote>`). (05)

**Git / GitHub** — Historial del código / servidor donde se guarda. (15)

**Hash** — Transformación irreversible de un dato. (08)

**Hibernate** — Biblioteca que traduce objetos Java a SQL (implementa JPA). (06)

**Hook** — Función `useAlgo` de React que agrega capacidades a un componente. (11)

**HTTP / HTTPS** — Protocolo de la web / su versión cifrada. (03)

**Idempotente** — Que hacerlo dos veces da lo mismo que una (la carga demo). (07)

**Imagen (Docker)** — Paquete de solo lectura a partir del cual se crean contenedores. (13)

**Índice** — Estructura que acelera las búsquedas en una tabla. (04)

**Inyección de dependencias** — Las clases reciben lo que necesitan en el constructor y Spring se
lo pasa. (06)

**Inyección SQL** — Ataque que mete código SQL en un dato. Se evita con parámetros. (04, 08)

**Invalidar (consulta)** — Marcar datos guardados como viejos para volver a pedirlos. (11)

**Invariante** — Regla que siempre tiene que cumplirse (`0 ≤ cantidad_actual ≤ cantidad_inicial`). (09)

**Jackson** — Biblioteca que convierte objetos Java ↔ JSON. (06)

**Java / JVM** — Lenguaje del backend / la máquina virtual que lo ejecuta. (05)

**JOIN** — Juntar tablas por sus claves en una consulta. (04)

**JPA / JPQL** — Estándar para mapear clases a tablas / su lenguaje de consultas. (06)

**JSON** — Formato de texto para los datos. (03)

**JSX / TSX** — HTML dentro de JavaScript/TypeScript (React). (11)

**JUnit** — Biblioteca de pruebas de Java. (14)

**JWT** — Token firmado que identifica al usuario en cada pedido. (08)

**Lambda / función flecha** — Función corta sin nombre (`x -> x * 2`, `(x) => x * 2`). (02)

**Lazy (carga perezosa)** — No traer una relación de la base hasta que se usa. (06)

**Linter (ESLint)** — Programa que revisa el código buscando errores y malas prácticas. (15)

**Lombok** — Genera getters, setters y constructores al compilar. (05)

**Lote** — Partida de un medicamento con número y vencimiento. (01)

**Maven** — Herramienta de construcción y dependencias de Java. (15)

**Migración** — Archivo `.sql` versionado que cambia el esquema. (04)

**Mock** — Objeto falso que reemplaza una dependencia en una prueba. (14)

**Monorepo** — Un solo repositorio con backend, frontend y documentación. (03 de la carpeta del proyecto)

**Movimiento de stock** — Registro de cada cambio de cantidad de un lote. (09)

**nginx** — Servidor web que entrega el frontend y reenvía `/api` al backend. (03, 13)

**Node.js / npm** — JavaScript fuera del navegador / su gestor de paquetes. (10, 15)

**Normalización (1FN, 2FN, 3FN)** — Organizar tablas para no repetir datos. (04)

**null** — "No hay valor". (02)

**OpenAPI / Swagger** — Descripción estándar de la API / página para verla y probarla. (15)

**Optional** — Contenedor que puede tener un valor o no. (05)

**ORM** — Mapeo objeto-relacional: trabajar con objetos y que la biblioteca genere SQL. (06)

**OWASP Top 10** — Lista de los riesgos de seguridad web más comunes. (08)

**Paginación** — Pedir los datos de a páginas (20 por vez). (03)

**Paquete** — Carpeta de clases Java. (02)

**Perfil (Spring)** — Configuración según el entorno (`dev`, `demo`, `prod`). (13)

**Permiso** — Acción concreta habilitada (`STOCK_INGRESAR`). Un rol es un conjunto de permisos. (08)

**ProblemDetail (RFC 9457)** — Formato estándar de errores HTTP. (03)

**Promise** — Valor que va a estar disponible más adelante. (10)

**Props** — Datos que un componente React recibe de su padre. (11)

**Proxy** — Intermediario que reenvía pedidos. (03)

**React** — Biblioteca para construir interfaces con componentes. (11)

**React Router** — Muestra una pantalla u otra según la URL sin recargar. (11)

**Record** — Clase Java corta e inmutable para transportar datos. (05)

**Repositorio (código)** — Interfaz de acceso a una tabla (`AreaRepository`). (06)

**Repositorio (git)** — Carpeta del proyecto con su historial. (15)

**REST** — Estilo de API: recursos con URL, métodos HTTP y códigos de estado. (03)

**Rol** — ADMIN, FARMACEUTICO o CONSULTA. (08)

**Rollback** — Deshacer una transacción. (04)

**Sal (salt)** — Valor aleatorio que se agrega antes de hacer el hash de una contraseña. (08)

**Servicio** — Clase con las reglas de negocio. (06)

**sessionStorage** — Almacenamiento del navegador que se borra al cerrar la pestaña. (08, 10)

**SPA** — Aplicación de una sola página. (03)

**Specification** — Forma de armar filtros opcionales para una consulta JPA. (06)

**Spring Boot / Spring Security** — Framework del backend / su módulo de seguridad. (06, 08)

**SQL** — Lenguaje para consultar y modificar bases relacionales. (04)

**Stateless (sin estado)** — El servidor no recuerda pedidos anteriores; cada uno trae su token. (03)

**Stock total** — Suma de los lotes no vencidos. No se guarda. (09)

**Stream (Java)** — Cadena de operaciones sobre una colección (`filter`, `map`, `sorted`). (05)

**TanStack Query** — Biblioteca que maneja los datos del servidor en el frontend. (11)

**TDD** — Escribir la prueba antes del código. (14)

**Testcontainers** — Levanta una base real en Docker durante las pruebas. (14)

**Token** — Credencial temporal que se manda en cada pedido. (08)

**Transacción** — Grupo de operaciones que se hacen todas o ninguna. (04)

**Transferencia** — Entrega de medicamentos a un área. (01)

**Trazabilidad** — Poder reconstruir de dónde vino y a dónde fue cada unidad. (09)

**TypeScript** — JavaScript con tipos. (10)

**UNIQUE** — Restricción que impide repetir un valor. (04)

**URL** — Dirección de un recurso en la web. (03)

**UTC** — Hora universal; Argentina es UTC−3. (09)

**Validación (Bean Validation)** — Reglas sobre los datos de entrada (`@NotBlank`, `@Positive`). (06)

**Variable de entorno** — Configuración que el sistema le pasa a un programa al arrancar. (13)

**Vite** — Herramienta de desarrollo y compilación del frontend. (10)

**Volumen** — Almacenamiento persistente de Docker. (13)

**WCAG** — Pautas internacionales de accesibilidad web. (12)

**XSS** — Ataque que inyecta código en una página para que se ejecute en el navegador de otro. (08)
