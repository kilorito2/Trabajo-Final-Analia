# 00 — Cómo usar esta carpeta

Esta carpeta es para vos si **programaste alguna vez pero ya te olvidaste casi todo**, y tenés que
entender (y defender) este proyecto. Está escrita desde cero: cada tema empieza por la idea básica,
con ejemplos de la vida cotidiana, y termina mostrando **dónde y cómo se usa en este proyecto**,
con el código real.

No hace falta leer todo de una. Está pensada para ir de a poco.

## Mapa de la carpeta

| # | Archivo | De qué trata | Nivel |
|---|---|---|---|
| 01 | [El proyecto en un vistazo](01-el-proyecto-en-un-vistazo.md) | Qué hace el sistema, en palabras simples. **Empezá acá.** | Básico |
| 02 | [Repaso de programación](02-repaso-de-programacion.md) | Variables, tipos, funciones, condicionales, bucles, clases, objetos, excepciones. | Básico |
| 03 | [Cómo funciona la web](03-como-funciona-la-web.md) | Cliente, servidor, HTTP, URL, JSON, API REST, códigos de estado. | Básico |
| 04 | [Bases de datos y SQL](04-bases-de-datos-y-sql.md) | Tablas, claves, relaciones, SQL, normalización, transacciones, bloqueos. | Básico → medio |
| 05 | [Java desde cero](05-java-desde-cero.md) | El lenguaje del backend: sintaxis, clases, records, enums, colecciones, streams. | Básico → medio |
| 06 | [Spring Boot](06-spring-boot.md) | El framework del backend: inyección de dependencias, anotaciones, JPA, validación. | Medio |
| 07 | [Recorrido del backend](07-recorrido-del-backend.md) | Cada carpeta del backend y el viaje de un pedido de punta a punta. | Medio |
| 08 | [Seguridad explicada](08-seguridad-explicada.md) | Contraseñas, hash, BCrypt, JWT, roles, permisos, 401/403, ataques comunes. | Medio |
| 09 | [Reglas de negocio: FEFO, stock y concurrencia](09-reglas-de-negocio.md) | El corazón del sistema, con ejemplos numéricos paso a paso. | Medio |
| 10 | [JavaScript y TypeScript](10-javascript-y-typescript.md) | El lenguaje del frontend. | Básico → medio |
| 11 | [React](11-react.md) | Componentes, props, estado, hooks, JSX. | Medio |
| 12 | [Recorrido del frontend](12-recorrido-del-frontend.md) | Cada carpeta del frontend y cómo se arma una pantalla. | Medio |
| 13 | [Docker y entornos](13-docker-y-entornos.md) | Contenedores, imágenes, compose, variables de entorno, perfiles. | Básico → medio |
| 14 | [Pruebas (tests)](14-pruebas.md) | Para qué sirven, tipos, cómo se leen las del proyecto. | Medio |
| 15 | [Git y herramientas](15-git-y-herramientas.md) | Git, GitHub, commits, ramas, Maven, npm, linters, CI. | Básico |
| 16 | [Glosario](16-glosario.md) | Todas las palabras raras, de la A a la Z. | Consulta |
| 17 | [Autoevaluación](17-autoevaluacion.md) | Preguntas con respuesta para comprobar que entendiste. | Repaso |

## Plan de estudio sugerido (7 días, 1 a 2 horas por día)

| Día | Leer | Objetivo del día |
|---|---|---|
| 1 | 01, 02, 03 | Poder explicar qué hace el sistema y cómo se hablan el navegador y el servidor. |
| 2 | 04 | Entender las tablas del proyecto y por qué están así (3FN). |
| 3 | 05, 06 | Leer una clase Java del proyecto sin perderse. |
| 4 | 07, 09 | Seguir una transferencia de punta a punta y explicar FEFO y concurrencia. |
| 5 | 08 | Explicar login, JWT, roles y por qué el sistema es seguro. |
| 6 | 10, 11, 12 | Entender cómo se arma una pantalla del frontend. |
| 7 | 13, 14, 15, 17 | Levantar el sistema, correr las pruebas y hacer la autoevaluación. |

Después, leé el [guion de la defensa](../defensa/guion-de-defensa.md) y practicá la demostración.

## Consejos

- **Tené el código abierto al lado.** Abrí la carpeta del proyecto en VS Code. Cuando el texto diga
  `backend/src/.../TransferenciaService.java`, abrilo (en VS Code: `Ctrl + P` y escribí el nombre del
  archivo).
- **Levantá el sistema y tocá.** Nada ayuda más que ver funcionar lo que estás leyendo. Las
  instrucciones están en [13-docker-y-entornos.md](13-docker-y-entornos.md).
- **No memorices código.** En la defensa nadie te va a pedir que escribas Java de memoria. Te van a
  preguntar **qué hace, por qué se decidió así y qué pasaría si no**. Esta carpeta está organizada
  alrededor de esos "por qué".
- **Si una palabra no la entendés**, buscala en el [glosario](16-glosario.md).
- Los recuadros **"En el proyecto"** muestran dónde aparece cada concepto. Los recuadros **"Para la
  defensa"** son frases que podés usar tal cual.

## Convenciones de esta carpeta

> **En el proyecto:** así se marca dónde aparece el concepto en el código.

> **Para la defensa:** así se marcan las respuestas cortas para el tribunal.

> **Ojo:** así se marcan las confusiones comunes.

Los bloques grises son código. No hace falta entender cada símbolo: leé los comentarios (las
líneas que empiezan con `//` o `--`), que explican qué hace cada parte.
