# 15 — Git y herramientas

## 1. Git: el historial del código

**Git** guarda **fotos** (versiones) del proyecto a lo largo del tiempo. Permite volver atrás, ver
quién cambió qué y trabajar varias personas a la vez sin pisarse.

| Concepto | Qué es |
|---|---|
| **Repositorio** | La carpeta del proyecto con todo su historial (la carpeta oculta `.git`). |
| **Commit** | Una foto del proyecto con un mensaje que explica el cambio. |
| **Rama (branch)** | Una línea de trabajo paralela. Se trabaja en una rama y después se junta con la principal. |
| **Merge** | Juntar los cambios de una rama en otra. |
| **Remoto** | Copia del repositorio en un servidor (GitHub). |
| **Push / Pull** | Subir tus commits al remoto / traer los del remoto. |
| **Clone** | Copiar un repositorio remoto a tu máquina. |
| **Pull request (PR)** | Pedido en GitHub para juntar una rama, con revisión. |
| **`.gitignore`** | Archivos que git no tiene que guardar (`.env`, `node_modules`, `target`). |

### Comandos básicos

```bash
git status                 # qué cambió
git diff                   # ver los cambios línea por línea
git add archivo            # preparar un archivo para el próximo commit
git commit -m "mensaje"    # guardar la foto
git log --oneline          # historial resumido
git switch -c mi-rama      # crear una rama y pasarse a ella
git switch main            # volver a main
git pull                   # traer cambios
git push                   # subir cambios
```

### Conventional Commits

Los mensajes del proyecto siguen un formato: `tipo(alcance): descripción en español`.

```
feat(transferencia): descontar stock con criterio FEFO
fix(seguridad): devolver 401 en JSON sin redirigir
test(alerta): cubrir bordes de vencimiento
docs: presupuesto con valor hora de $25.000
```

| Tipo | Significa |
|---|---|
| `feat` | Funcionalidad nueva. |
| `fix` | Corrección de un error. |
| `test` | Pruebas. |
| `docs` | Documentación. |
| `refactor` | Cambio interno sin cambiar el comportamiento. |
| `build` | Compilación, dependencias, Docker. |

Commits **chicos**: cada uno con un cambio coherente. Así el historial cuenta la historia del
proyecto y es fácil encontrar cuándo se introdujo algo.

## 2. Maven (backend)

**Maven** es la herramienta de construcción de Java. Lee `backend/pom.xml`, donde están:

- Las **dependencias** (bibliotecas): Spring Boot, PostgreSQL, Flyway, Lombok, OpenPDF… Maven las
  descarga solo.
- Los **plugins**: compilar, correr pruebas (Surefire y Failsafe), formato (Spotless), cobertura
  (JaCoCo).

El proyecto trae el **wrapper** (`mvnw`, `mvnw.cmd`): un script que descarga la versión correcta de
Maven, así no hace falta instalarlo.

| Comando | Qué hace |
|---|---|
| `./mvnw compile` | Compila. |
| `./mvnw test` | Pruebas unitarias. |
| `./mvnw verify` | Formato + unitarias + integración (el que se usa antes de cada commit). |
| `./mvnw spotless:apply` | Formatea el código. |
| `./mvnw spring-boot:run` | Levanta el backend. |
| `./mvnw package` | Genera el `.jar` en `target/`. |

**El BOM de Spring Boot:** las versiones de las bibliotecas que maneja Spring Boot no se escriben
en el `pom.xml`: Spring Boot elige versiones compatibles entre sí. Solo se fija la versión de lo
que Spring no maneja (springdoc, Spotless, JaCoCo, OpenPDF…).

## 3. npm (frontend)

**npm** es el gestor de paquetes de Node. Lee `frontend/package.json`:

- `dependencies`: lo que va en la aplicación (React, TanStack Query, React Router, lucide-react).
- `devDependencies`: herramientas de desarrollo (TypeScript, Vite, ESLint, Vitest, Playwright).
- `scripts`: comandos con nombre.

`package-lock.json` fija las versiones exactas para que todos instalen lo mismo.
`node_modules/` es donde se descargan (no se sube a git).

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias. |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173. |
| `npm run build` | Compila para producción en `dist/`. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Verificación de tipos. |
| `npm test` | Pruebas. |
| `npm run format` | Prettier. |
| `npm run knip` | Código sin usar. |
| `npm run api:tipos` | Regenerar los tipos desde el OpenAPI del backend. |
| `npm run mock` | Backend simulado. |
| `npm run capturas` | Prueba e2e + capturas. |

## 4. Calidad automática

| Herramienta | Dónde | Qué controla |
|---|---|---|
| **Spotless** + google-java-format | Backend | Formato del código Java. `verify` falla si no está aplicado. |
| **ESLint** | Frontend | Errores comunes, reglas de React, accesibilidad (`jsx-a11y`), prohibiciones (`innerHTML`, `console`, `alert`). Sin advertencias permitidas. |
| **Prettier** | Frontend | Formato. |
| **TypeScript estricto** | Frontend | Tipos. |
| **knip** | Frontend | Archivos, exports y dependencias sin usar. |

El objetivo: que el estilo y los errores obvios los controle una máquina, y la revisión humana se
concentre en la lógica.

## 5. Documentar la API: OpenAPI y Swagger

- **OpenAPI**: formato estándar (JSON/YAML) que describe todos los endpoints, sus parámetros y
  respuestas. Lo genera **springdoc** a partir de los controladores: http://localhost:8080/v3/api-docs.
- **Swagger UI**: página web que muestra ese contrato y permite **probar** la API desde el
  navegador: http://localhost:8080/swagger-ui.html (botón "Authorize" para pegar el token).
- `docs/api/farmacia.http`: pedidos listos para la extensión **REST Client** de VS Code.

## 6. Editor recomendado: VS Code

Extensiones útiles: *Extension Pack for Java*, *ESLint*, *Prettier*, *REST Client*, *Docker*,
*Markdown Preview Mermaid Support*.

Atajos: `Ctrl + P` (abrir archivo por nombre), `Ctrl + Shift + F` (buscar en todo el proyecto),
`F12` (ir a la definición), `Shift + F12` (dónde se usa).

## 7. Asistentes de IA

Durante el desarrollo se usó un asistente de programación con IA como herramienta. Lo importante
para la defensa: cada parte se especificó con criterios de aceptación **antes**, se revisó, y se
verificó con pruebas automáticas; las decisiones están registradas con su justificación en
`docs/decisiones.md`. Esta carpeta existe para que puedas explicar cada una.
