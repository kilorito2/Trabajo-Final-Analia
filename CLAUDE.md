# Farmacia Hospitalaria

Spring Boot 4, no 3. Java 21, PostgreSQL 16, Flyway, Spring Security (OAuth2 Resource Server, HS256).

## Comandos (desde `backend/`)

- Build y todos los tests: `./mvnw verify` (PowerShell: `.\mvnw.cmd verify`). Necesita Docker corriendo.
- Formato: `./mvnw spotless:apply` antes de cada commit. `verify` falla si no está aplicado.
- Levantar todo: `docker compose up --build` desde la raíz (con `.env` armado desde `.env.example`).
- Levantar solo la API: `docker compose up -d db` y `SPRING_PROFILES_ACTIVE=dev,demo ./mvnw spring-boot:run`.

## Convenciones

- Paquetes por funcionalidad: Entidad, Repository, Service, Controller y record DTO con `desde(...)`.
- Nombres de dominio en español; términos de Spring en inglés.
- Controladores sin lógica ni repositorios. Servicios con `@Transactional` / `@Transactional(readOnly = true)`.
- Lombok solo `@Getter`, `@Setter` selectivo y `@RequiredArgsConstructor`. Nunca `@Data`.
- Comentarios solo para explicar el por qué. Sin código muerto, sin `System.out`, sin `@Autowired` en campos.
- Commits chicos en Conventional Commits con descripción en español.

## Reglas no negociables

- El usuario sale solo del JWT validado; rol y permisos se leen de la base en cada pedido.
- `JWT_SECRET` por variable de entorno, mínimo 32 bytes. Sin endpoint de registro.
- Nunca se devuelven entidades ni el hash de la contraseña.
- Stock nunca negativo: `@Positive`, invariantes en `Lote`, CHECK en la base y bloqueo pesimista ordenado por id.
- Transferencias FEFO, todo o nada. Un lote vencido (fecha < hoy) nunca se transfiere.
- "Hoy" sale siempre del `Clock` con zona America/Argentina/Buenos_Aires.
- Bajas lógicas, sin cascadas. Una migración aplicada no se edita.
- Errores como ProblemDetail con `codigo`. Nunca `@Disabled` ni `-DskipTests` (salvo el Dockerfile).
