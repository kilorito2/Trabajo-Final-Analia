# Frontend — Farmacia Hospitalaria

Interfaz web del sistema de control de stock de la farmacia (React 19 + Vite + TypeScript). Consume la API del backend del mismo repositorio.

## Requisitos

- Node 24 LTS (mínimo 22.22).
- El backend levantado en `http://localhost:8080` (ver el README de la raíz).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite redirige `/api` a `http://localhost:8080`, así que no hace falta CORS. `VITE_API_URL` es opcional y solo sirve para apuntar a otro servidor:

```powershell
# PowerShell
$env:VITE_API_URL = "http://otro-servidor:8080"; npm run dev
```

```bash
# bash o Git Bash
VITE_API_URL=http://otro-servidor:8080 npm run dev
```

## Tipos de la API

Los tipos salen del OpenAPI del backend (con el backend levantado en `dev` o `demo`):

```bash
npm run api:tipos   # regenera src/api/esquema.ts; no se edita a mano
```

## Calidad

```bash
npm run lint        # sin advertencias
npm run typecheck
npm test
npm run knip        # código y dependencias sin usar
npm run format
```

## Producción

```bash
npm run build       # genera dist/
```

La imagen Docker compila con Node y sirve `dist/` con nginx sin root en el puerto 8080. nginx hace de proxy de `/api` al servicio `api` y manda la CSP y las cabeceras de seguridad.
