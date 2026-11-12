# Frontend — Farmacia Hospitalaria

Interfaz web del sistema de control de stock de la farmacia (React 19 + Vite + TypeScript). Consume la API del backend del mismo repositorio.

## Requisitos

- Node 24 LTS (mínimo 22.22).
- El backend levantado en `http://localhost:8080` (ver el README de la raíz), o el backend simulado (ver abajo).

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

### Backend simulado (provisorio)

Mientras el backend real no existe, `npm run mock` levanta en el puerto 8080 un servidor con datos en memoria que respeta el contrato (`contrato/openapi-provisorio.yaml`). Usuarios: `admin`, `farmaceutico` y `consulta`, todos con la contraseña `demo1234`. Los datos se reinician cada vez que arranca. Se borra cuando el backend esté listo.

## Tipos de la API

Los tipos salen del OpenAPI del backend (con el backend levantado en `dev` o `demo`):

```bash
npm run api:tipos              # regenera src/api/esquema.ts; no se edita a mano
npm run api:tipos:provisorio   # mientras tanto, desde el contrato provisorio
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

## Recorrido de punta a punta

Con la app levantada contra el backend en modo demo, `npm run e2e:recorrido` crea, edita, busca, da
de baja y reactiva en todas las pantallas y prueba los errores y los permisos. Modifica los datos
demo (todo lo que crea lleva el mismo sufijo numérico). Usa `CAPTURAS_USUARIO` y `CAPTURAS_PASSWORD`
igual que las capturas.

## Capturas para el informe

Con la app levantada (`npm run dev` más el backend en modo demo, o el backend simulado), la primera vez:

```bash
npx playwright install chromium
```

Después:

```bash
npm run capturas    # guarda ../docs/capturas/NN-pantalla.png y corre axe en cada pantalla
```

Variables opcionales: `CAPTURAS_URL` (por ejemplo `http://localhost:8081` para probar la imagen Docker), `CAPTURAS_USUARIO` y `CAPTURAS_PASSWORD` (con el backend real, la de `ADMIN_PASSWORD`).

```powershell
# PowerShell
$env:CAPTURAS_URL = "http://localhost:8081"; npm run capturas
```

```bash
# bash o Git Bash
CAPTURAS_URL=http://localhost:8081 npm run capturas
```
