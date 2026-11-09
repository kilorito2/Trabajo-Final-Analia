# Plan del frontend

Rebanadas de `Front_v2.md` §2.1. Criterios de aceptación en `docs/spec-frontend.md`. Cada rebanada cierra con `lint`, `typecheck`, `test`, `build` y `knip` en verde, revisión en el navegador y commit.

Mientras el backend no exista, solo avanza lo que no depende de sus tipos (marcado **independiente**).

| # | Rebanada | Depende del back | Estado |
|---|---|---|---|
| 1 | Esqueleto: Vite, TS, ESLint, Prettier, Vitest, knip, tokens y estilos, layout, router y proxy | No | Hecho |
| 2a | Cliente de API, errores, `QueryClient`, almacenamiento de la sesión | No | Hecho |
| 2b | `SesionProvider`, `puede()`, `RutaProtegida`, login, aviso de vencimiento, "Salir", menú filtrado por permisos | Sí (`LoginResponse`, `UsuarioSesion`, `Permiso`) | Pendiente |
| 3a | Componentes base: `Tabla`, `Paginador`, `Modal`, `Confirmacion`, `CampoFormulario`, `Insignia`, `Avisos`, `Vacio`, `Cargando`, `ErrorCarga`, `EncabezadoPagina`, `LimiteErrores`; hooks `useFormulario`, `useDebounce` y `useFiltrosUrl`; utilidades | No | Hecho |
| 3b | `BuscadorMedicamento` (combobox ARIA) | Sí (`MedicamentoResponse`) | Pendiente |
| 4 | Áreas y proveedores | Sí | Pendiente |
| 5 | Medicamentos: lista, alta, edición y detalle | Sí | Pendiente |
| 6 | Ingreso de mercadería | Sí | Pendiente |
| 7 | Nueva transferencia y comprobante | Sí | Pendiente |
| 8 | Historial y exportación | Sí | Pendiente |
| 9 | Lotes y vencimientos | Sí | Pendiente |
| 10 | Panel | Sí | Pendiente |
| 11 | Usuarios y Mi cuenta | Sí | Pendiente |
| 12a | `Dockerfile`, `nginx.conf`, `.dockerignore`, README del front | No | Hecho (falta probar la imagen con Docker Desktop) |
| 12b | Servicio `web` en `docker-compose.yml`, job de CI, capturas con Playwright y axe | Sí (archivos de la raíz y backend levantado) | Pendiente |

## Para destrabar las rebanadas pendientes

1. El backend sube su esqueleto (raíz del monorepo) y expone `/v3/api-docs` en `dev` o `demo`.
2. `git rebase origin/main` sobre `front/base` (hoy no tienen historia común; el front solo toca `frontend/` y `docs/*-frontend.md`).
3. `npm run api:tipos`, se escribe `src/api/tipos.ts` y se sigue por la rebanada 2b.
