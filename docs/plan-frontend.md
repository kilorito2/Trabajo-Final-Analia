# Plan del frontend

Rebanadas de `Front_v2.md` §2.1. Criterios de aceptación en `docs/spec-frontend.md`. Cada rebanada cierra con `lint`, `typecheck`, `test`, `build` y `knip` en verde, revisión en el navegador y commit.

Mientras el backend no existe, el front se construye contra un **contrato provisorio** (`frontend/contrato/openapi-provisorio.yaml`) y un **backend simulado** (`frontend/mock/servidor.mjs`). Ver `docs/decisiones-frontend.md`.

| # | Rebanada | Estado |
|---|---|---|
| 1 | Esqueleto: Vite, TS, ESLint, Prettier, Vitest, knip, tokens y estilos, layout, router y proxy | Hecho |
| 2 | Cliente de API, sesión, login, rutas protegidas, "Sin permiso", aviso de vencimiento | Hecho |
| 3 | Componentes base, incluido `BuscadorMedicamento` (combobox ARIA) | Hecho |
| 4 | Áreas y proveedores | Hecho |
| 5 | Medicamentos: lista, alta, edición y detalle con lotes y movimientos | Hecho |
| 6 | Ingreso de mercadería | Hecho |
| 7 | Nueva transferencia y comprobante imprimible | Hecho |
| 8 | Historial de transferencias y exportación | Hecho |
| 9 | Lotes y vencimientos (baja y ajuste) | Hecho |
| 10 | Panel | Hecho |
| 11 | Usuarios y Mi cuenta | Hecho |
| 12a | `Dockerfile`, `nginx.conf`, README, capturas con Playwright y axe | Hecho (imagen probada con Docker Desktop: cabeceras, caché, gzip, proxy, usuario no root y consola sin errores con la CSP) |
| 12b | Servicio `web` en `docker-compose.yml` y job `frontend` en el CI | Pendiente: son archivos de la raíz que crea el backend. Listos para pegar en `docs/integracion-frontend.md`. |

## Cuando el backend esté listo

1. `git fetch origin && git rebase origin/main` sobre `front/base` (hoy no tienen historia común; el front solo toca `frontend/` y `docs/*-frontend.md`).
2. Levantar el backend en `dev` o `demo` y correr `npm run api:tipos`.
3. `npm run typecheck`: cada error marca una diferencia con el contrato provisorio. Se corrige `src/api/tipos.ts` (nombres) o se avisa al backend (datos que faltan).
4. Borrar `frontend/contrato/`, `frontend/mock/` y los scripts `mock` y `api:tipos:provisorio`.
5. Sumar el servicio `web` y el job de CI (`docs/integracion-frontend.md`) y fusionar `docs/decisiones-frontend.md` con `docs/decisiones.md`.
6. `npm run capturas` con el stack en modo demo (usuario `admin` y la contraseña de `ADMIN_PASSWORD` en `CAPTURAS_PASSWORD`).
