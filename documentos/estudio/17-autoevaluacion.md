# 17 — Autoevaluación

Intentá responder cada pregunta **en voz alta**, como si estuvieras frente al tribunal, y recién
después abrí la respuesta (hacé clic en "Ver respuesta"). Si una te cuesta, el número entre
paréntesis indica qué archivo releer.

## Nivel 1 — Lo general

<details><summary>1. ¿Qué hace el sistema, en dos oraciones? (01)</summary>

Gestiona el stock por lote de la farmacia de un hospital público: registra ingresos y
transferencias a las áreas aplicando FEFO, bajas y ajustes, con trazabilidad completa. Avisa
vencimientos y faltantes y genera reportes en Excel y PDF, con acceso por roles.
</details>

<details><summary>2. ¿Qué diferencia hay entre frontend y backend? ¿Dónde está la seguridad? (01, 03)</summary>

El frontend son las pantallas que corren en el navegador; el backend es el servidor que aplica las
reglas y guarda los datos. La seguridad real está en el backend, porque el frontend corre en la
máquina del usuario y se puede modificar. El frontend solo oculta lo que no corresponde, por
comodidad.
</details>

<details><summary>3. ¿Cuáles son los tres roles y qué puede hacer cada uno? (08)</summary>

ADMIN: todo, incluso usuarios. FARMACEUTICO: operar el stock y el catálogo (ingresos,
transferencias, bajas, ajustes, ABM de medicamentos, proveedores y áreas). CONSULTA: solo ver y
sacar reportes.
</details>

<details><summary>4. Nombrá cuatro problemas del prototipo y cómo se resolvieron. (08)</summary>

Identidad en una cabecera falsificable → identidad solo del JWT y permisos de la base. Clave del
JWT en el código → variable de entorno de 32+ bytes. Stock negativo → validación, entidad, CHECK y
bloqueo. Hash expuesto → solo DTO. (También: registro libre, fechas como texto, borrado en cascada,
errores genéricos sin pruebas.)
</details>

## Nivel 2 — Web y API

<details><summary>5. ¿Qué es un endpoint? Dá un ejemplo. (03)</summary>

Un método HTTP más una ruta. Ejemplo: `POST /api/transferencias` crea una transferencia.
</details>

<details><summary>6. ¿Qué diferencia hay entre 401 y 403? (03, 08)</summary>

401: no sé quién sos (sin token, inválido, vencido o usuario desactivado). 403: sé quién sos pero
no tenés permiso.
</details>

<details><summary>7. ¿Qué devuelve el sistema cuando falta stock en una transferencia? (03, 09)</summary>

409 Conflict con `codigo: STOCK_INSUFICIENTE` y una lista `faltantes` con cada medicamento, lo
disponible y lo solicitado. No se modifica nada.
</details>

<details><summary>8. ¿Por qué no hace falta configurar CORS? (03)</summary>

Porque el navegador le habla a un solo origen: Vite (en desarrollo) o nginx (en producción) sirven
el frontend y reenvían `/api` al backend como un proxy.
</details>

## Nivel 3 — Base de datos

<details><summary>9. ¿Por qué el lote no guarda el nombre del medicamento? (04)</summary>

Por la 3FN: el nombre depende de `medicamento_id`, no del lote. Si se guardara en cada lote, al
corregir el nombre habría que cambiarlo en muchas filas y podrían quedar distintos. Se obtiene con
un JOIN.
</details>

<details><summary>10. ¿Por qué el stock total no es una columna? (04, 09)</summary>

Porque depende de los lotes (y de la fecha de hoy, ya que excluye los vencidos). Guardarlo crearía
una dependencia transitiva y el riesgo de que no coincida con la suma real. Se calcula con SUM y
GROUP BY.
</details>

<details><summary>11. ¿Hay alguna redundancia en el modelo? ¿Está justificada? (04)</summary>

`movimiento_stock.saldo_resultante`. Se guarda como dato histórico de auditoría (el saldo que vio el
usuario en ese momento). Nunca se actualiza, así que no genera anomalías, y permite detectar
inconsistencias.
</details>

<details><summary>12. ¿Para qué sirve la tabla detalle_transferencia? (04)</summary>

Resuelve la relación muchos a muchos entre transferencias y lotes, y registra cuántas unidades
salieron de cada lote en cada transferencia.
</details>

<details><summary>13. ¿Qué pasa si se intenta borrar un proveedor con lotes? (04)</summary>

No hay forma de borrarlo desde la API (no hay DELETE), y la base no lo permitiría porque las claves
foráneas no tienen cascada. Se desactiva (baja lógica); sus lotes siguen disponibles.
</details>

<details><summary>14. ¿Qué es Flyway y por qué no se edita una migración aplicada? (04)</summary>

Aplica los scripts SQL numerados en orden y registra cuáles aplicó. Si se edita uno ya aplicado,
las bases existentes no recibirían el cambio y quedarían distintas; Flyway lo detecta y no arranca.
Los cambios van en una migración nueva.
</details>

## Nivel 4 — Backend

<details><summary>15. ¿Qué hace cada capa: controller, service, repository? (06, 07)</summary>

Controller: traduce HTTP ↔ Java, valida el formato y el permiso, sin lógica. Service: reglas de
negocio dentro de una transacción. Repository: consultas a la base.
</details>

<details><summary>16. ¿Qué es la inyección de dependencias y para qué sirve? (06)</summary>

Las clases reciben lo que necesitan en el constructor en lugar de crearlo, y Spring se lo pasa.
Sirve para desacoplar y para poder reemplazar dependencias por simulaciones en las pruebas.
</details>

<details><summary>17. ¿Por qué se usa un Clock y no LocalDate.now()? (05, 09)</summary>

Por la zona horaria: el servidor corre en UTC y después de las 21 h de Argentina ya sería mañana,
mostrando lotes vencidos antes de tiempo. Y por las pruebas: con un reloj fijo los casos de borde
dan siempre igual.
</details>

<details><summary>18. ¿Cómo se convierten las excepciones en respuestas HTTP? (06)</summary>

Los servicios lanzan excepciones de dominio (RecursoNoEncontrado, ReglaNegocio, StockInsuficiente)
y un único `@RestControllerAdvice` (ManejadorErrores) las traduce a ProblemDetail con el código
HTTP y un `codigo` propio.
</details>

<details><summary>19. ¿Qué es un DTO y por qué no se devuelven entidades? (06)</summary>

Un objeto (record) solo con los datos que entran o salen por la API. Si se devolviera la entidad
Usuario saldría el hash de la contraseña; además se acopla la API a la base.
</details>

## Nivel 5 — Reglas de negocio

<details><summary>20. Un lote vence hoy. ¿Está vencido? ¿Se puede transferir? (09)</summary>

No está vencido: es POR_VENCER. Sí se puede transferir. Vencido es fecha anterior a hoy.
</details>

<details><summary>21. Hay un lote de 80 que vence en enero y uno de 200 que vence en diciembre. Piden 100. ¿Qué sale? (09)</summary>

FEFO: primero el de diciembre. Salen 100 del lote de diciembre (quedan 100) y nada del de enero.
</details>

<details><summary>22. Y si piden 250? (09)</summary>

200 del de diciembre (queda en 0) y 50 del de enero (quedan 30). El comprobante tiene dos renglones.
</details>

<details><summary>23. Se piden tres medicamentos y falta stock de uno. ¿Qué pasa con los otros dos? (09)</summary>

No se descuenta nada (todo o nada). Se responde 409 con todos los faltantes y el frontend conserva
lo cargado.
</details>

<details><summary>24. Explicá la concurrencia y cómo se resolvió. (04, 09)</summary>

Dos transferencias simultáneas podrían leer el mismo stock y entregar de más. Se bloquean los lotes
con SELECT … FOR UPDATE en una sola consulta: la segunda espera a que termine la primera y ve el
stock actualizado. Se ordena por id para que todas bloqueen en el mismo orden y no haya deadlock.
TransferenciaConcurrenciaIT lo demuestra con dos hilos contra PostgreSQL real.
</details>

<details><summary>25. ¿En cuántos lugares se protege que el stock no sea negativo? (09)</summary>

Tres: validación de la entrada (@Positive), la entidad Lote (descontar lanza excepción) y el CHECK
de la base. Más el bloqueo para la concurrencia.
</details>

<details><summary>26. ¿Qué invariante relaciona los movimientos con el lote? (09)</summary>

La suma de las cantidades de los movimientos de un lote es igual a su cantidad actual.
FlujoCompletoIT lo verifica.
</details>

<details><summary>27. ¿Se puede desactivar un medicamento con stock? ¿Y un proveedor? (09)</summary>

Medicamento con stock no vencido: no (MEDICAMENTO_CON_STOCK). Proveedor con lotes con stock: sí;
sus lotes siguen disponibles, pero no se lo puede elegir en ingresos nuevos.
</details>

<details><summary>28. ¿Cómo se corrige una transferencia equivocada? (09)</summary>

No se anula ni se edita. Se hace un ajuste del lote con el motivo (por ejemplo, "Devolución de
TR-000123"), que queda registrado.
</details>

## Nivel 6 — Seguridad

<details><summary>29. ¿Cómo se guardan las contraseñas y por qué BCrypt? (08)</summary>

Como hash BCrypt con costo 12. Es irreversible, tiene sal aleatoria y es lento a propósito, así que
no se pueden probar millones de contraseñas por segundo si roban la base.
</details>

<details><summary>30. ¿Qué tiene el JWT del sistema? ¿Por qué no lleva el rol? (08)</summary>

Emisor, id del usuario (sub), fecha de emisión y de vencimiento. No lleva el rol porque los permisos
se leen de la base en cada pedido: así una baja o un cambio de rol tienen efecto inmediato.
</details>

<details><summary>31. Si alguien cambia el id dentro del token, ¿qué pasa? (08)</summary>

La firma HMAC-SHA256 deja de coincidir (no conoce la clave secreta) y el servidor responde 401.
</details>

<details><summary>32. ¿Por qué CSRF está deshabilitado? (08)</summary>

Porque la API no usa cookies: el token va en la cabecera Authorization, que el navegador no agrega
solo. CSRF necesita que el navegador mande la credencial automáticamente.
</details>

<details><summary>33. ¿Cómo se evita XSS? (08)</summary>

React escapa todo el texto, ESLint prohíbe innerHTML y dangerouslySetInnerHTML, y nginx manda una
CSP estricta. Hay una prueba con un nombre de medicamento malicioso.
</details>

<details><summary>34. ¿Por qué el login responde igual si el usuario no existe? (08)</summary>

Para no revelar qué usuarios existen. Incluso el tiempo de respuesta es similar porque se calcula un
hash igual.
</details>

<details><summary>35. ¿Cómo funciona la recuperación de contraseña? (08)</summary>

Se pide con el usuario; se genera un código de 6 números que se guarda con hash, vence en 15
minutos y admite 5 intentos. El envío es simulado (en demo se muestra en pantalla). La respuesta es
la misma exista o no el usuario.
</details>

## Nivel 7 — Frontend

<details><summary>36. ¿Qué es un componente y qué es el estado en React? (11)</summary>

Un componente es una función que devuelve un pedazo de pantalla. El estado es su memoria: cuando
cambia, React lo vuelve a dibujar.
</details>

<details><summary>37. ¿Para qué se usa TanStack Query? (11)</summary>

Para pedir datos al backend con caché, estados de carga y error, reintento controlado e invalidación
después de cada cambio.
</details>

<details><summary>38. ¿Por qué hay un solo archivo con fetch? (12)</summary>

Para que el token, el tiempo máximo y la traducción de errores (401, 403, 5xx, red) se manejen igual
en toda la aplicación, y poder probarlo por separado.
</details>

<details><summary>39. ¿Por qué las fechas no pasan por new Date()? (10, 12)</summary>

Porque `new Date('2026-11-30')` se interpreta como medianoche UTC y en Argentina mostraría el 29.
Las fechas sin hora se tratan como texto.
</details>

<details><summary>40. ¿Qué pasa con una transferencia a medio cargar si se vence la sesión? (12)</summary>

Se conserva: el borrador se guarda en sessionStorage y se recupera al volver a ingresar en la misma
pestaña.
</details>

## Nivel 8 — Herramientas y calidad

<details><summary>41. ¿Qué es Docker Compose y qué levanta en este proyecto? (13)</summary>

Una herramienta para levantar varios contenedores con un archivo. Levanta PostgreSQL 16 (con un
volumen para los datos) y el backend, que espera a que la base esté lista.
</details>

<details><summary>42. ¿Dónde están los secretos y por qué no en el código? (13)</summary>

En variables de entorno (archivo .env, que no se sube a git). Si estuvieran en el código, cualquiera
con acceso al repositorio los tendría (problema 2 del prototipo).
</details>

<details><summary>43. ¿Qué diferencia hay entre prueba unitaria y de integración? (14)</summary>

La unitaria prueba una pieza sola con simulaciones y es rápida. La de integración prueba varias
piezas juntas; acá, la API completa contra un PostgreSQL real con Testcontainers.
</details>

<details><summary>44. ¿Por qué PostgreSQL real en las pruebas y no H2? (14)</summary>

Para probar lo que hace PostgreSQL de verdad: CHECK, FOR UPDATE y SQL específico. Una prueba con
otra base podría pasar y fallar en producción.
</details>

<details><summary>45. ¿Cómo se calculó el presupuesto? (carpeta del proyecto, 09)</summary>

444 horas del sistema y 128 de la mejora, a $25.000 la hora (sueldo mediano semi senior de Sysarmy /
160 horas × 1,6 por trabajo independiente). Total $14.300.000, sin costo de licencias.
</details>

## Respuestas al ejercicio del archivo 07

1. `ReglaNegocioException` con el código `CUIT_DUPLICADO` → 409. (Y si dos pedidos llegan a la vez,
   la restricción `uq_proveedor_cuit` de la base lo frena y `ManejadorErrores` la traduce igual a
   409.)
2. En la anotación `@Cuit` del record `ProveedorRequest`, implementada por `CuitValidator`
   (pesos 5,4,3,2,7,6,5,4,3,2).
3. Siguen disponibles para transferir; solo que el proveedor ya no se puede elegir en ingresos
   nuevos (`PROVEEDOR_INACTIVO`).

## Checklist final antes de la defensa

- [ ] Puedo explicar el sistema en un minuto.
- [ ] Puedo dibujar la arquitectura (navegador → frontend → backend → base).
- [ ] Puedo dibujar el diagrama ER y justificar la 3FN.
- [ ] Puedo explicar FEFO con un ejemplo numérico.
- [ ] Puedo explicar la concurrencia, el bloqueo y el deadlock.
- [ ] Puedo explicar login, BCrypt, JWT, roles, 401 y 403.
- [ ] Sé qué prueba demuestra cada problema del prototipo resuelto.
- [ ] Levanté el sistema con Docker y practiqué la demo.
- [ ] Leí el [guion de la defensa](../defensa/guion-de-defensa.md).
