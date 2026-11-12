# 13 — Docker y entornos

## 1. El problema que resuelve Docker

"En mi máquina anda." Para correr el sistema hace falta Java 21, PostgreSQL 16 con cierta
configuración, variables de entorno… Instalarlo a mano en cada computadora es lento y cada una
termina distinta.

**Docker** empaqueta cada programa con **todo lo que necesita** (sistema base, Java, bibliotecas) en
un **contenedor** aislado, que corre igual en Windows, Linux o macOS.

## 2. Conceptos

| Concepto | Analogía | Qué es |
|---|---|---|
| **Imagen** | La receta (o el molde) | Paquete de solo lectura con el programa y sus dependencias. Ej.: `postgres:16-alpine`. |
| **Contenedor** | La torta hecha con la receta | Una imagen **ejecutándose**. Se puede crear, parar y borrar. |
| **Dockerfile** | La receta escrita | Archivo con los pasos para construir una imagen. |
| **Volumen** | Un disco externo | Lugar donde se guardan datos que tienen que sobrevivir al contenedor (la base). |
| **Puerto publicado** | Una ventanilla | Conecta un puerto de tu máquina con uno del contenedor (`127.0.0.1:8080:8080`). |
| **Docker Compose** | El plano de la cocina | Archivo (`docker-compose.yml`) que levanta **varios** contenedores juntos y los conecta. |
| **Registro (Docker Hub)** | El supermercado | De donde se descargan imágenes públicas. |

> **Ojo:** un contenedor **no** es una máquina virtual completa: comparte el núcleo del sistema
> operativo, por eso arranca en segundos y ocupa poco.

## 3. El `docker-compose.yml` del proyecto

```yaml
services:
  db:                                        # la base de datos
    image: postgres:16-alpine                # imagen oficial, versión fija (nunca "latest")
    environment:
      POSTGRES_DB: farmacia
      POSTGRES_USER: ${DB_USER:-farmacia}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Definí DB_PASSWORD en .env}   # obligatoria
    volumes:
      - farmacia-db:/var/lib/postgresql/data   # los datos viven en un volumen
    ports:
      - "127.0.0.1:${DB_PUERTO:-5432}:5432"    # solo accesible desde esta máquina
    healthcheck:                               # "estoy lista" cuando pg_isready responde
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]

  api:                                       # el backend
    build: ./backend                         # se construye con backend/Dockerfile
    depends_on:
      db:
        condition: service_healthy           # espera a que la base esté lista
    env_file: .env                           # toma las variables del .env
    environment:
      DB_URL: jdbc:postgresql://db:5432/farmacia   # "db" es el nombre del otro servicio
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-demo}
    ports:
      - "127.0.0.1:8080:8080"

volumes:
  farmacia-db:
```

Dentro de la red de Compose, los servicios se encuentran **por su nombre**: el backend se conecta
a `db:5432`, no a `localhost`.

## 4. El Dockerfile del backend (multi-etapa)

```dockerfile
# Etapa 1: compilar (imagen grande, con el JDK)
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline   # bajar dependencias (capa en caché)
COPY src src
RUN ./mvnw -B -q package -DskipTests && ...               # compilar el .jar

# Etapa 2: ejecutar (imagen chica, solo el JRE)
FROM eclipse-temurin:21-jre
RUN groupadd --system farmacia && useradd --system --gid farmacia ... farmacia
COPY --from=build /app/extraido/... ./                    # solo lo compilado
USER farmacia                                             # sin privilegios de root
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

Por qué así:

- **Dos etapas:** la imagen final no lleva el compilador ni el código fuente: es más chica y más
  segura.
- **Dependencias primero:** si solo cambia el código (no el `pom.xml`), Docker reusa la capa con
  las dependencias ya descargadas y compila mucho más rápido.
- **`-DskipTests`:** única excepción a la regla de no saltear pruebas: dentro del build no hay
  Docker para Testcontainers. Las pruebas corren con `./mvnw verify` y en la integración continua.
- **Usuario sin root:** si alguien lograra entrar al contenedor, no tendría privilegios.

El del frontend es parecido: compila con Node (`npm ci` + `npm run build`) y sirve `dist/` con
`nginx-unprivileged` (nginx sin root) en el puerto 8080.

## 5. Variables de entorno y el archivo `.env`

Una **variable de entorno** es un valor que el sistema operativo le pasa a un programa al
arrancarlo. Sirven para la **configuración que cambia según dónde corre** el programa (y para los
**secretos**), sin tocar el código.

```
.env.example   → plantilla SIN secretos, se sube a git
.env           → copia con los valores reales, NO se sube (está en .gitignore)
```

| Variable | Para qué |
|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_PUERTO` | Base de datos. |
| `JWT_SECRET` | Clave para firmar los tokens (≥ 32 bytes). |
| `ADMIN_PASSWORD` | Contraseña del `admin` inicial. |
| `DEMO_PASSWORD` | Contraseña de los usuarios demo. |
| `CORS_ORIGENES` | Orígenes permitidos (vacío normalmente). |
| `SPRING_PROFILES_ACTIVE` | `demo`, `prod`, `dev`. |

En `application.yml`, `${JWT_SECRET:}` quiere decir "el valor de la variable `JWT_SECRET`, o vacío
si no existe".

## 6. Perfiles (entornos)

| Perfil | Cuándo | Qué cambia |
|---|---|---|
| `dev` | Programando en tu máquina. | Valores por defecto de conexión, SQL en el log, Swagger. |
| `demo` | Para mostrar el sistema. | Carga datos de ejemplo; muestra el código de recuperación; Swagger. |
| `prod` | En el hospital. | Sin datos de ejemplo, sin Swagger. |
| `test` | Pruebas automáticas. | Reloj fijo, base en Testcontainers. |

`demo` + `prod` juntos → la aplicación **no arranca** (para no cargar datos falsos en producción
por error).

## 7. Comandos que vas a usar

| Comando | Qué hace |
|---|---|
| `docker compose up --build` | Construye las imágenes y levanta todo (ves los logs). `Ctrl + C` para parar. |
| `docker compose up -d --build` | Igual, pero en segundo plano. |
| `docker compose ps` | Qué contenedores están corriendo y si están sanos. |
| `docker compose logs -f api` | Ver los logs del backend en vivo. |
| `docker compose down` | Parar y borrar los contenedores (los datos quedan en el volumen). |
| `docker compose down -v` | Igual, y **borra los datos** (empezar de cero). |
| `docker compose up -d db` | Levantar solo la base (para correr el backend desde el IDE). |
| `docker compose exec db psql -U farmacia farmacia` | Abrir una consola SQL dentro de la base. |

## 8. Levantar todo, paso a paso (para practicar)

1. Abrí **Docker Desktop** y esperá a que diga que está corriendo.
2. En la carpeta del proyecto: `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`).
3. Editá `.env`: poné una `DB_PASSWORD`, generá un `JWT_SECRET` (comando en `.env.example`) y poné
   un `ADMIN_PASSWORD`.
4. `docker compose up --build` y esperá `Started FarmaciaApplication`.
5. Probá http://localhost:8080/actuator/health → `{"status":"UP"}`.
6. En otra terminal: `cd frontend`, `npm install` (la primera vez) y `npm run dev`.
7. Abrí http://localhost:5173 e ingresá con `farmaceutico` / `demo1234` o `admin` / tu
   `ADMIN_PASSWORD`.

### Mirar la base por dentro

```bash
docker compose exec db psql -U farmacia farmacia
```

```sql
\dt                                  -- listar tablas
select * from area;                  -- ver las áreas
select numero_lote, fecha_vencimiento, cantidad_actual from lote order by fecha_vencimiento limit 10;
select tipo, cantidad, saldo_resultante from movimiento_stock where lote_id = 1 order by fecha_hora;
\q                                   -- salir
```

## 9. Integración continua (CI)

Cada vez que se sube código a GitHub, **GitHub Actions** (`.github/workflows/ci.yml`) levanta una
máquina limpia, instala Java 21 y corre `./mvnw verify` (formato + todas las pruebas del backend,
con Docker para Testcontainers). Si algo falla, se ve en rojo en GitHub. Así nadie puede romper
algo sin enterarse.

## Resumen

| Concepto | En una frase |
|---|---|
| Imagen / contenedor | Receta / torta hecha con la receta. |
| Dockerfile | Pasos para construir una imagen. |
| Compose | Levantar varios contenedores juntos. |
| Volumen | Datos que sobreviven a los contenedores. |
| Variable de entorno | Configuración y secretos fuera del código. |
| Perfil | Juego de configuración según el entorno. |
| CI | Prueba automática de cada cambio en GitHub. |
