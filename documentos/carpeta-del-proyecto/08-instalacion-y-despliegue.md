# 8. Instalación y despliegue (manual técnico)

## 8.1 Requisitos

| Para | Necesitás |
|---|---|
| Levantar el sistema | **Docker Desktop** (Windows/macOS) o Docker Engine + Compose (Linux), corriendo. |
| Desarrollar el backend o correr sus pruebas fuera de Docker | **JDK 21**. Maven **no** hace falta: el proyecto trae el *wrapper* (`mvnw` / `mvnw.cmd`). |
| Desarrollar el frontend | **Node.js 24 LTS** (mínimo 22.22) y npm. |
| Clonar el repositorio | Git. |

Hardware orientativo para un servidor del hospital: 2 núcleos, 4 GB de RAM, 10 GB de disco.

## 8.2 Obtener el código

```bash
git clone [COMPLETAR: URL del repositorio]
cd Farmacia
```

## 8.3 Configurar las variables de entorno

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
```

Editá `.env` y completá:

| Variable | Qué poner |
|---|---|
| `DB_PASSWORD` | Una contraseña para la base de datos. |
| `JWT_SECRET` | Una clave aleatoria de al menos 32 bytes (ver abajo cómo generarla). |
| `ADMIN_PASSWORD` | La contraseña del usuario `admin` (mínimo 8 caracteres). Solo se usa la primera vez. |
| `DEMO_PASSWORD` | Contraseña de `farmaceutico` y `consulta` en el modo demo (por defecto `demo1234`). |
| `SPRING_PROFILES_ACTIVE` | `demo` (con datos de ejemplo) o `prod` (vacío, para uso real). |
| `DB_PUERTO` | Cambialo (por ejemplo a 5433) si ya tenés otro PostgreSQL en el 5432. |
| `CORS_ORIGENES` | Vacío si el frontend va detrás del mismo proxy (lo normal). |

Generar `JWT_SECRET`:

```bash
openssl rand -base64 48
```

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

> El archivo `.env` tiene secretos: **nunca** se sube al repositorio (está en `.gitignore`).

## 8.4 Levantar todo con Docker

```bash
docker compose up --build
```

Levanta tres servicios: la base (`db`), la API (`api`) y la aplicación web (`web`).

- La primera vez descarga las imágenes y compila el backend y el frontend (varios minutos).
- La aplicación queda en http://localhost:8081.
- Cuando aparece `Started FarmaciaApplication`, la API está en http://localhost:8080.
- Si alguno de esos puertos ya está ocupado, se cambian en `.env` con `API_PUERTO`, `WEB_PUERTO` y
  `DB_PUERTO`.
- Verificación: http://localhost:8080/actuator/health → `{"status":"UP"}`.
- Swagger (perfil demo): http://localhost:8080/swagger-ui.html.

Para dejarlo corriendo en segundo plano: `docker compose up -d --build`. Para ver los logs:
`docker compose logs -f api`. Para detenerlo: `docker compose down` (los datos quedan en el
volumen). Para **borrar también los datos**: `docker compose down -v`.

## 8.5 Levantar el frontend

### Desarrollo

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Vite reenvía `/api` a `http://localhost:8080`. Si el backend está en otro puerto:

```powershell
$env:API_DESTINO = "http://localhost:8090"; npm run dev
```

### Producción

```bash
cd frontend
npm run build          # genera frontend/dist/
docker build -t farmacia-web .
```

La imagen (`nginxinc/nginx-unprivileged`) sirve `dist/` en el puerto 8080 del contenedor, reenvía
`/api/` al servicio `api` y agrega las cabeceras de seguridad. Es el servicio `web` de
`docker-compose.yml` (sección 8.4), que la construye solo. Para publicar en la red del hospital conviene poner HTTPS
(certificado del hospital) en un proxy delante de `web`.

## 8.6 Usuarios iniciales

| Usuario | Contraseña | Rol | Cuándo existe |
|---|---|---|---|
| `admin` | la de `ADMIN_PASSWORD` | ADMIN | Siempre (se crea si no hay ningún ADMIN). |
| `farmaceutico` | `DEMO_PASSWORD` | FARMACEUTICO | Solo con el perfil `demo`. |
| `consulta` | `DEMO_PASSWORD` | CONSULTA | Solo con el perfil `demo`. |

En producción, el `admin` crea los usuarios reales desde la pantalla **Usuarios** y conviene que
cambie su contraseña desde **Mi cuenta**.

## 8.7 Desarrollo del backend sin Docker para la API

```bash
docker compose up -d db
cd backend
DB_PASSWORD=<la del .env> JWT_SECRET=... ADMIN_PASSWORD=... SPRING_PROFILES_ACTIVE=dev,demo ./mvnw spring-boot:run
```

```powershell
docker compose up -d db
cd backend
$env:DB_PASSWORD="<la del .env>"; $env:JWT_SECRET="..."; $env:ADMIN_PASSWORD="..."; $env:SPRING_PROFILES_ACTIVE="dev,demo"
.\mvnw.cmd spring-boot:run
```

## 8.8 Backend simulado (solo frontend)

Para trabajar en el frontend sin levantar Java ni la base:

```bash
cd frontend
PUERTO_MOCK=8090 npm run mock                       # datos en memoria; usuarios admin/farmaceutico/consulta, contraseña demo1234
API_DESTINO=http://localhost:8090 npm run dev       # en otra terminal
```

## 8.9 Comandos de calidad

| Dónde | Comando | Qué hace |
|---|---|---|
| `backend/` | `./mvnw verify` | Formato + pruebas unitarias + integración (Docker corriendo). Reporte de cobertura en `target/site/jacoco/index.html`. |
| `backend/` | `./mvnw spotless:apply` | Aplica el formato (antes de cada commit). |
| `frontend/` | `npm run lint` | ESLint sin advertencias. |
| `frontend/` | `npm run typecheck` | Verificación de tipos. |
| `frontend/` | `npm test` | Pruebas con Vitest. |
| `frontend/` | `npm run knip` | Código y dependencias sin usar. |
| `frontend/` | `npm run capturas` | Recorrido e2e + accesibilidad + capturas (la primera vez: `npx playwright install chromium`). |
| `frontend/` | `npm run api:tipos` | Regenera los tipos desde el OpenAPI del backend levantado. |

## 8.10 Copias de seguridad

```bash
# Respaldo
docker compose exec db pg_dump -U farmacia farmacia > respaldo_$(date +%F).sql
# Restauración (con la base vacía)
docker compose exec -T db psql -U farmacia farmacia < respaldo_2026-11-12.sql
```

Se recomienda un respaldo diario automático (tarea programada de Windows o `cron`) guardado fuera
del servidor.

## 8.11 Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `Definí DB_PASSWORD en .env` | Falta el `.env` o la variable. | Copiá `.env.example` a `.env` y completalo. |
| La API no arranca: mensaje sobre `JWT_SECRET` | Falta la clave o tiene menos de 32 bytes. | Generá una con el comando de 8.3. |
| `port is already allocated` en 5432 | Hay otro PostgreSQL en esa máquina. | Poné `DB_PUERTO=5433` en `.env`. |
| `port is already allocated` en 8080 | Otro programa usa el 8080. | Cerralo o cambiá el puerto publicado en `docker-compose.yml`. |
| `/bin/sh^M: bad interpreter` al compilar | `mvnw` con fines de línea de Windows. | El repo trae `.gitattributes` que lo evita; volvé a clonar o `git checkout -- backend/mvnw`. |
| Las pruebas del backend fallan con error de Docker | Testcontainers necesita Docker. | Abrí Docker Desktop y esperá a que diga "running". |
| El frontend muestra "No se pudo conectar con el servidor." | El backend no está levantado o el proxy apunta a otro puerto. | Verificá `/actuator/health` y la variable `API_DESTINO`. |
| Cambié `ADMIN_PASSWORD` y no anda | Solo se usa si no existe ningún ADMIN. | Cambiá la contraseña desde **Mi cuenta** o borrá los datos con `docker compose down -v` (pierde todo). |
