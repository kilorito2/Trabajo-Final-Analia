# Build: primero solo los manifiestos, así `npm ci` queda en una capa cacheada.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Ejecución: nginx sin root, en el puerto 8080.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-cabeceras.conf /etc/nginx/cabeceras-seguridad.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
