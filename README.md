# Farmacia Hospitalaria

Sistema de control de stock para la farmacia de un hospital público: catálogo de medicamentos,
ingreso de lotes, transferencias a las áreas con criterio FEFO, bajas por vencimiento, ajustes,
alertas, recuperación de contraseña y reportes en Excel y PDF. Trabajo final de la
Tecnicatura Universitaria en Programación (UTN).

## Qué hay en el repo

| Carpeta | Qué tiene |
|---|---|
| `backend/` | API REST en Spring Boot 4.1 y Java 21, con PostgreSQL 16 y Flyway. |
| `frontend/` | Interfaz en React 19 y TypeScript (Vite), servida por nginx en Docker. Ver su [README](frontend/README.md). |
| `docs/` | Documentación de trabajo: especificaciones, decisiones, modelo de datos, presupuesto y capturas. |
| `documentos/` | Lo que se entrega del TFI: informe final, carpeta del proyecto, manual, guion de la defensa y sus PDF. |

## Requisitos

- JDK 21 (solo para correr el backend o los tests fuera de Docker).
- Node.js 22.22 o más nuevo (solo para trabajar en el frontend fuera de Docker).
- Docker Desktop corriendo (lo usan `docker compose` y los tests con Testcontainers).

No hace falta instalar Maven: el proyecto trae el wrapper (`mvnw` / `mvnw.cmd`).

## Levantar todo con Docker

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
# completá JWT_SECRET, ADMIN_PASSWORD y DB_PASSWORD en .env
docker compose up --build
```

La aplicación queda en http://localhost:8081 y la API en http://localhost:8080. Por defecto arranca
con el perfil `demo` (datos de ejemplo). Si algún puerto está ocupado, cambialo en `.env` con
`WEB_PUERTO`, `API_PUERTO` o `DB_PUERTO`.

## Levantar el backend en local

```bash
docker compose up -d db
cd backend
# bash
DB_PASSWORD=<la del .env> JWT_SECRET=... ADMIN_PASSWORD=... SPRING_PROFILES_ACTIVE=dev,demo ./mvnw spring-boot:run
```

```powershell
docker compose up -d db
cd backend
$env:DB_PASSWORD="<la del .env>"; $env:JWT_SECRET="..."; $env:ADMIN_PASSWORD="..."; $env:SPRING_PROFILES_ACTIVE="dev,demo"
.\mvnw.cmd spring-boot:run
```

## Levantar el frontend en local

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173, reenvía /api a http://localhost:8080
```

Si la API está en otro puerto: `API_DESTINO=http://localhost:8085 npm run dev`
(PowerShell: `$env:API_DESTINO="http://localhost:8085"; npm run dev`).

## Variables de entorno

| Variable | Para qué | Obligatoria |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Conexión a PostgreSQL (en `dev` hay valores por defecto) | Sí, salvo en `dev` |
| `JWT_SECRET` | Clave HS256, mínimo 32 bytes. Sin ella la app no arranca | Sí |
| `ADMIN_PASSWORD` | Contraseña del `admin` inicial. Solo se usa si no hay ningún ADMIN | La primera vez |
| `DEMO_PASSWORD` | Contraseña de los usuarios demo (por defecto `demo1234`) | No |
| `CORS_ORIGENES` | Orígenes permitidos, separados por coma | No |
| `SPRING_PROFILES_ACTIVE` | `dev`, `demo`, `prod` (nunca `demo` y `prod` juntos) | No |
| `DB_PUERTO`, `API_PUERTO`, `WEB_PUERTO` | Puertos locales de `docker compose` (5432, 8080 y 8081) | No |

Para generar `JWT_SECRET`: `openssl rand -base64 48` (bash) o el comando de PowerShell que está en
`.env.example`.

## Usuarios del perfil demo

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | la de `ADMIN_PASSWORD` | ADMIN |
| `farmaceutico` | `DEMO_PASSWORD` (`demo1234`) | FARMACEUTICO |
| `consulta` | `DEMO_PASSWORD` (`demo1234`) | CONSULTA |

## Tests

```bash
cd backend
./mvnw verify          # PowerShell: .\mvnw.cmd verify
```

Corre el formato (Spotless), los tests unitarios (`*Test`) y los de integración (`*IT`, con
PostgreSQL 16 en Testcontainers). El reporte de cobertura queda en `backend/target/site/jacoco`.
Antes de commitear: `./mvnw spotless:apply`.

```bash
cd frontend
npm run lint && npm run typecheck && npm test
```

El CI (`.github/workflows/ci.yml`) corre las dos partes en cada push.

## Documentación de la API

- Swagger UI (perfiles `dev` y `demo`): http://localhost:8080/swagger-ui.html
- OpenAPI: http://localhost:8080/v3/api-docs
- Pedidos listos para probar: `docs/api/farmacia.http`
- Especificación y criterios de aceptación: `docs/spec.md`
- Decisiones de diseño: `docs/decisiones.md`
- Modelo de datos (diagrama entidad-relación y 3FN): `docs/modelo-datos.md`
- Cumplimiento de la consigna del TFI: `docs/consigna.md`
- Mejora propuesta y presupuesto: `docs/presupuesto.md`

Documentación para la entrega del TFI (informe final, carpeta del proyecto, manual de usuario,
guion de la defensa y carpeta de estudio): [`documentos/`](documentos/README.md).
