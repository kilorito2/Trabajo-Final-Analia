# 03 — Cómo funciona la web

## 1. Cliente y servidor

- **Cliente**: el programa que **pide**. Acá, el navegador (Chrome) con nuestras pantallas.
- **Servidor**: el programa que **responde**. Acá, el backend en Java.

Es como un mostrador: el cliente hace un pedido, el servidor lo atiende y devuelve una respuesta.
El cliente nunca entra a la cocina (la base de datos): todo pasa por el mostrador.

## 2. URL

Una **URL** es la dirección de algo en la web:

```
http://localhost:8080/api/medicamentos/5?activo=true&page=0
└┬─┘   └───┬───┘└┬─┘└─────────┬────────┘└────────┬────────┘
protocolo  host  puerto     ruta             parámetros (query string)
```

- **localhost**: "esta misma computadora".
- **Puerto**: número que identifica a qué programa le hablás dentro de la máquina. El backend
  escucha en el **8080**, el frontend de desarrollo en el **5173**, PostgreSQL en el **5432**.
- **Ruta**: qué recurso querés (`/api/medicamentos/5` = el medicamento 5).
- **Parámetros**: filtros u opciones (`activo=true`).

## 3. HTTP: el idioma del pedido y la respuesta

Cada pedido HTTP tiene:

1. Un **método** (qué querés hacer).
2. Una **URL** (sobre qué).
3. **Cabeceras** (datos extra: quién sos, qué formato mandás).
4. Opcionalmente, un **cuerpo** (los datos).

Y cada respuesta tiene un **código de estado**, cabeceras y opcionalmente un cuerpo.

```http
POST /api/areas HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{ "nombre": "Hemodiálisis" }
```

```http
HTTP/1.1 201 Created
Location: /api/areas/9
Content-Type: application/json

{ "id": 9, "nombre": "Hemodiálisis", "activo": true }
```

### Métodos

| Método | Para qué | Ejemplo en el proyecto |
|---|---|---|
| **GET** | Leer. No cambia nada. | `GET /api/medicamentos` (lista) |
| **POST** | Crear o ejecutar una acción. | `POST /api/transferencias` |
| **PUT** | Reemplazar los datos de algo. | `PUT /api/areas/3` (editar) |
| **PATCH** | Cambiar una parte. | `PATCH /api/areas/3/estado` (activar/desactivar) |
| **DELETE** | Borrar. | **No se usa**: las bajas son lógicas. |

### Códigos de estado

El primer dígito dice la familia: **2xx** salió bien, **4xx** el cliente mandó algo mal, **5xx**
falló el servidor.

| Código | Nombre | Cuándo lo devuelve el sistema |
|---|---|---|
| **200** | OK | Consulta o edición correcta. |
| **201** | Created | Se creó algo (con la cabecera `Location`). |
| **202** | Accepted | Pedido de código de recuperación aceptado. |
| **204** | No Content | Salió bien y no hay nada que devolver (cambio de estado o de contraseña). |
| **400** | Bad Request | Datos inválidos (campo vacío, fecha pasada, JSON mal escrito). |
| **401** | Unauthorized | No hay sesión, o el token es inválido o venció. "No sé quién sos." |
| **403** | Forbidden | Hay sesión pero no tenés permiso. "Sé quién sos, pero no podés." |
| **404** | Not Found | No existe (el medicamento 999). |
| **409** | Conflict | Choca con una regla (stock insuficiente, código repetido). |
| **500** | Internal Server Error | Error inesperado del servidor. |

> **Para la defensa:** "401 es 'no sé quién sos' y 403 es 'sé quién sos pero no tenés permiso'."

### Cabeceras que importan acá

| Cabecera | Para qué |
|---|---|
| `Authorization: Bearer <token>` | Identifica al usuario en cada pedido. |
| `Content-Type: application/json` | "El cuerpo que te mando es JSON." |
| `Accept: application/json` | "Quiero que me respondas en JSON." |
| `Location` | En un 201, dónde quedó lo creado. |
| `Content-Disposition: attachment; filename="..."` | "Esto es un archivo para descargar, con este nombre." |

### HTTP no tiene memoria

Cada pedido es **independiente**: el servidor no recuerda el anterior. Por eso cada pedido tiene
que traer el token que dice quién sos. Eso se llama **sin estado** (*stateless*).

## 4. JSON

**JSON** es el formato de texto con el que viajan los datos. Es fácil de leer para personas y
programas:

```json
{
  "id": 5,
  "codigo": "PARA-500",
  "nombre": "Paracetamol",
  "stockTotal": 510,
  "activo": true,
  "proximoVencimiento": "2026-12-01",
  "lotes": [
    { "numeroLote": "L2301", "cantidadActual": 100 },
    { "numeroLote": "L2340", "cantidadActual": 410 }
  ]
}
```

- `{ }` = un objeto (pares nombre: valor).
- `[ ]` = una lista.
- Textos entre comillas dobles; números, `true`/`false` y `null` sin comillas.

En el backend, Spring convierte automáticamente los objetos Java a JSON y al revés (con la
biblioteca **Jackson**).

## 5. API y REST

Una **API** (*Application Programming Interface*) es el "menú" de cosas que un programa le ofrece a
otro. Nuestro backend ofrece una API: el frontend (u otro programa) la usa.

**REST** es un estilo para diseñar APIs sobre HTTP:

- Cada **recurso** (medicamento, área, lote) tiene una URL: `/api/medicamentos`,
  `/api/medicamentos/5`.
- Se opera con los **métodos HTTP** (GET leer, POST crear, PUT editar…).
- Las respuestas usan los **códigos de estado** correctos.
- Es **sin estado**.

Cada combinación método + ruta se llama **endpoint**: `GET /api/medicamentos` es un endpoint,
`POST /api/medicamentos` es otro. La lista completa está en
[`../carpeta-del-proyecto/05-api.md`](../carpeta-del-proyecto/05-api.md).

### Paginación

Si hay 2.000 movimientos, no se mandan todos juntos. Se piden de a **páginas**:

```
GET /api/movimientos?page=0&size=20&sort=fechaHora,desc
```

Y la respuesta trae el contenido de esa página más la información para navegar:

```json
{ "content": [ ... 20 movimientos ... ],
  "page": { "number": 0, "size": 20, "totalElements": 2000, "totalPages": 100 } }
```

## 6. Errores con formato estándar

Cuando algo sale mal, el backend responde con el formato estándar **Problem Details (RFC 9457)**,
más un `codigo` propio:

```json
{
  "title": "Operación rechazada",
  "status": 409,
  "detail": "El área Guardia está inactiva.",
  "codigo": "AREA_INACTIVA"
}
```

- `detail` es el mensaje para la persona (el frontend lo muestra tal cual).
- `codigo` es para el programa (el frontend lo usa para decidir qué hacer; por ejemplo, ante
  `STOCK_INSUFICIENTE` marca las líneas con faltante).

## 7. Qué hace el navegador

1. Descarga el HTML, el CSS (estilos) y el JavaScript del frontend.
2. Ejecuta el JavaScript, que dibuja las pantallas (React).
3. Cuando necesita datos, hace pedidos HTTP a `/api/...` con `fetch`.
4. Con la respuesta, actualiza la pantalla **sin recargar la página**. Eso es una **SPA** (*Single
   Page Application*).

### Navegación en una SPA

Cuando hacés clic en "Medicamentos", la URL cambia a `/medicamentos` pero **no se pide una página
nueva al servidor**: React Router cambia lo que se muestra. Si recargás (F5) en `/medicamentos`, el
servidor web (nginx o Vite) devuelve igual el `index.html` y React muestra la pantalla correcta.

## 8. Mismo origen, proxy y CORS

Un **origen** es protocolo + host + puerto. `http://localhost:5173` y `http://localhost:8080` son
**orígenes distintos**. Por seguridad, el navegador no deja que una página llame a otro origen salvo
que ese otro lo autorice (eso es **CORS**).

La solución del proyecto: un **proxy**. El navegador le pide todo al mismo origen
(`localhost:5173/api/...`) y Vite (en desarrollo) o nginx (en producción) **reenvían** los pedidos
`/api` al backend. El navegador cree que habla con un solo servidor y no hace falta CORS.

```mermaid
flowchart LR
    N[Navegador] -- "/medicamentos (pantalla)" --> V[Vite o nginx]
    N -- "/api/medicamentos (datos)" --> V
    V -- "reenvía /api" --> B[Backend :8080]
```

## 9. HTTPS

**HTTPS** es HTTP **cifrado**: nadie en el medio puede leer ni modificar lo que viaja (contraseñas,
tokens). En desarrollo usamos HTTP en `localhost`; en el hospital hay que poner HTTPS en el proxy
(con el certificado del hospital).

## Resumen

| Concepto | En una frase |
|---|---|
| Cliente / servidor | El que pide / el que responde. |
| URL | Dirección: protocolo, host, puerto, ruta, parámetros. |
| HTTP | Idioma de pedidos (método + URL + cabeceras + cuerpo) y respuestas (código + cuerpo). |
| JSON | Formato de texto de los datos. |
| API REST | Recursos con URL, operados con métodos HTTP y códigos de estado. |
| Endpoint | Un método + una ruta. |
| SPA | La página se carga una vez y cambia sin recargar. |
| Proxy | Intermediario que reenvía `/api` al backend para evitar CORS. |
