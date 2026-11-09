# Integración del frontend con la raíz del monorepo

Estos cambios van en archivos que crea el backend. Se aplican cuando existan, para no generar conflictos.

## `docker-compose.yml`: servicio `web`

```yaml
  web:
    build: ./frontend
    depends_on:
      - api
    ports:
      - "127.0.0.1:8081:8080"
```

`docker compose up --build` levanta `db`, `api` y `web`; la app queda en http://localhost:8081. nginx hace de proxy de `/api/` al servicio `api` (puerto 8080), así que no hace falta CORS.

## `.github/workflows/ci.yml`: job `frontend`

```yaml
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx knip
```

## `docs/decisiones.md`

Agregar el contenido de `docs/decisiones-frontend.md` como sección "Frontend" y borrar ese archivo.
