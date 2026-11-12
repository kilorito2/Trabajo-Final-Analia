# 10 — JavaScript y TypeScript

## 1. Qué son

- **JavaScript (JS)** es el lenguaje que entienden los navegadores. Todo lo que se mueve en una
  página web es JavaScript.
- **TypeScript (TS)** es JavaScript **con tipos**. Se escribe en `.ts` / `.tsx` y se **compila** a
  JavaScript. Los tipos no existen cuando el programa corre: sirven para que el compilador avise
  errores **antes**.

```ts
function formatearNumero(valor: number): string { ... }

formatearNumero('hola');   // ❌ TypeScript avisa al compilar: 'hola' no es number
```

> **En el proyecto:** TypeScript en modo **estricto**. Además, los tipos de los datos que vienen
> del backend se **generan automáticamente** a partir de su contrato (OpenAPI) en
> `src/api/esquema.ts`. Si el backend cambia un campo, el frontend deja de compilar y el error se
> ve enseguida.

## 2. Variables

```ts
const nombre = 'Amoxicilina';   // const: no se puede reasignar (lo normal)
let pagina = 0;                 // let: se puede reasignar
pagina = 1;
// var: forma vieja, no se usa
```

TypeScript **infiere** el tipo: `const nombre = 'Amoxicilina'` ya sabe que es `string`.

## 3. Tipos básicos y compuestos

```ts
const cantidad: number = 10;
const activo: boolean = true;
const codigo: string = 'AMOX-500';
const nada: null = null;
let sinDefinir: undefined;

const numeros: number[] = [1, 2, 3];          // lista
const lote: { numero: string; cantidad: number } = { numero: 'L2301', cantidad: 100 };  // objeto
```

### Alias de tipo (`type`)

```ts
type EstadoStock = 'SIN_STOCK' | 'STOCK_BAJO' | 'OK';   // solo uno de esos tres textos

type Medicamento = {
  id: number;
  codigo: string;
  nombre: string;
  stockTotal: number;
  estadoStock: EstadoStock;
  proximoVencimiento: string | null;   // texto o null
  activo: boolean;
};
```

- `A | B` (**unión**): puede ser A o B.
- `campo?: tipo`: el campo es **opcional**.

### Genéricos

```ts
function primero<T>(lista: T[]): T | undefined {
  return lista[0];
}
api.get<PaginaMedicamentos>('/api/medicamentos')   // "esto devuelve una PaginaMedicamentos"
```

## 4. Funciones

```ts
// Declaración
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  ...
}

// Función flecha
const doble = (n: number) => n * 2;
const columnas = medicamentos.map((m) => m.nombre);
```

`export` permite usar la función desde otro archivo con `import`.

## 5. Objetos y listas: lo que más se usa

```ts
const m = { id: 5, nombre: 'Paracetamol', stock: 510 };

m.nombre;                          // leer
const { nombre, stock } = m;       // desestructurar: sacar campos a variables
const copia = { ...m, stock: 0 };  // spread: copiar y cambiar un campo (sin modificar el original)

const lista = [3, 1, 2];
lista.map((n) => n * 2);           // [6, 2, 4]   transformar
lista.filter((n) => n > 1);        // [3, 2]      filtrar
lista.find((n) => n > 1);          // 3           el primero que cumple
lista.some((n) => n > 2);          // true        ¿alguno cumple?
lista.reduce((acc, n) => acc + n, 0);  // 6        acumular (sumar)
[...lista, 4];                     // [3, 1, 2, 4] copiar y agregar
```

> **Inmutabilidad:** en React no se modifican los objetos o listas del estado; se crean copias
> nuevas con `...`. Así React se da cuenta de que algo cambió.

### Operadores útiles

```ts
usuario?.permisos            // ?. : si usuario es null/undefined, da undefined en vez de error
valor ?? 'por defecto'       // ?? : si valor es null/undefined, usa el otro
activo ? 'Activo' : 'Inactivo'  // condicional en una línea
`Stock de ${nombre}: ${stock}`  // template string: texto con valores adentro (comillas invertidas)
```

## 6. Asincronía: promesas y async/await

Pedir datos al servidor **tarda**. JavaScript no se queda esperando (la pantalla se congelaría):
sigue con otras cosas y "promete" avisar cuando llegue la respuesta. Eso es una **Promise**.

```ts
async function cargarMedicamento(id: number) {
  const respuesta = await fetch(`/api/medicamentos/${id}`);   // await: esperá la respuesta
  if (!respuesta.ok) throw new Error('Falló');
  return await respuesta.json();                               // esperá el JSON
}
```

- `async` marca una función que devuelve una promesa.
- `await` espera el resultado de una promesa (solo dentro de funciones `async`).
- Los errores se atrapan con `try { ... } catch (error) { ... }`.

> **En el proyecto:** casi nunca se escribe `await` en las pantallas. TanStack Query se encarga de
> llamar, esperar y avisar "cargando / listo / error" (archivo 11 y 12). El único `fetch` de toda
> la aplicación está en `src/api/cliente.ts`.

## 7. Módulos (import / export)

Cada archivo es un **módulo**. Lo que se exporta se puede importar desde otro:

```ts
// utils/numeros.ts
export function formatearNumero(valor: number): string { ... }

// pages/medicamentos/PaginaMedicamentos.tsx
import { formatearNumero } from '../../utils/numeros';
```

`..` = carpeta de arriba. `../../utils/numeros` = "subí dos carpetas, entrá a utils, archivo
numeros".

## 8. El navegador: lo que usa el proyecto

| API del navegador | Para qué en el proyecto |
|---|---|
| `fetch` | Pedidos HTTP (solo en `cliente.ts`). |
| `AbortController` | Cortar un pedido a los 15 s o si se cierra la pantalla. |
| `sessionStorage` | Guardar el token y el borrador de la transferencia (se borran al cerrar la pestaña). |
| `Intl.NumberFormat`, `Intl.DateTimeFormat` | Mostrar números (`1.234`) y fechas (`30/11/2026`) en formato argentino. |
| `URLSearchParams` | Leer y escribir los parámetros de la URL (`?q=para&pagina=2`). |
| `Blob`, `URL.createObjectURL` | Descargar los archivos Excel y PDF. |
| `<dialog>` + `showModal()` | Cuadros de diálogo (modales). |
| `setTimeout` | Avisar 5 minutos antes de que venza la sesión. |

## 9. Fechas: la trampa

```ts
new Date('2026-11-30');   // ¡medianoche UTC! En Argentina (UTC−3) es 29/11 a las 21:00
```

Si la pantalla mostrara esa fecha, diría **29/11/2026**. Por eso, en `utils/fechas.ts`, las fechas
sin hora (`'2026-11-30'`) se tratan como **texto**: se separan año, mes y día con una expresión
regular y se arma `30/11/2026` sin pasar nunca por `new Date`. "Hoy" se calcula con
`Intl.DateTimeFormat` en la zona `America/Argentina/Buenos_Aires`.

## 10. Herramientas alrededor

| Herramienta | Qué hace |
|---|---|
| **Node.js** | Ejecuta JavaScript fuera del navegador; se usa para las herramientas de desarrollo. |
| **npm** | Instala bibliotecas (`npm install`) y corre comandos (`npm run dev`). La lista está en `package.json`. |
| **Vite** | Servidor de desarrollo (recarga al guardar) y compilación para producción. |
| **tsc** | El compilador de TypeScript (`npm run typecheck`). |
| **ESLint** | Revisa errores comunes y reglas del proyecto (por ejemplo, prohíbe `innerHTML` y `console.log`). |
| **Prettier** | Formatea el código automáticamente. |
| **knip** | Encuentra archivos, exports y dependencias que no se usan. |
| **Vitest** | Corre las pruebas. |

## Resumen

| Concepto | En una frase |
|---|---|
| TypeScript | JavaScript con tipos que se verifican al compilar. |
| `type` / unión | Describe la forma de los datos / "uno de estos". |
| `map`, `filter`, `find` | Transformar, filtrar, buscar en listas. |
| `...` (spread) | Copiar objetos o listas sin modificar el original. |
| `?.` y `??` | Acceso seguro y valor por defecto ante null. |
| Promise / async / await | Esperar algo que tarda sin congelar la pantalla. |
| import / export | Usar código de otro archivo. |
