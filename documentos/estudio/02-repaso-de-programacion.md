# 02 — Repaso de programación

Lo mínimo para leer el código del proyecto. Los ejemplos están en **Java** (backend) y
**TypeScript** (frontend), uno al lado del otro: la lógica es la misma, cambia la forma de escribir.

## 1. Programa, instrucciones, compilar

Un **programa** es una lista de instrucciones que la computadora ejecuta en orden. El código que
escribimos (código fuente) es texto; para que la computadora lo ejecute hay que **compilarlo**
(traducirlo) o **interpretarlo**.

- Java se **compila** a *bytecode* (`.class`), que ejecuta la **JVM** (Java Virtual Machine).
- TypeScript se **compila** a JavaScript, que ejecuta el **navegador**.

Si el código tiene un error de sintaxis o de tipos, el compilador avisa **antes** de ejecutar. Eso
es bueno: es mejor que falle en tu máquina que en la del usuario.

## 2. Variables y tipos

Una **variable** es una caja con nombre donde guardás un valor. El **tipo** dice qué clase de valor
cabe en la caja.

```java
// Java
int cantidad = 100;               // número entero
String nombre = "Amoxicilina";    // texto
boolean activo = true;            // verdadero o falso
LocalDate vence = LocalDate.of(2026, 11, 30);  // una fecha
```

```ts
// TypeScript
const cantidad: number = 100;
const nombre: string = 'Amoxicilina';
const activo: boolean = true;
let pagina = 0;            // let: puede cambiar; const: no
```

Tipos comunes:

| Idea | Java | TypeScript |
|---|---|---|
| Número entero | `int`, `long` (más grande), `Long` (puede ser null) | `number` |
| Texto | `String` | `string` |
| Verdadero/falso | `boolean` | `boolean` |
| Fecha sin hora | `LocalDate` | se maneja como texto `'2026-11-30'` |
| Fecha y hora | `OffsetDateTime` | texto ISO `'2026-11-09T17:49:00-03:00'` |
| "Nada" | `null` | `null` / `undefined` |
| Lista | `List<Lote>` | `Lote[]` |
| Diccionario (clave → valor) | `Map<Long, Integer>` | `Record<string, number>` / `Map` |

> **Ojo:** `int` no puede ser `null`; `Integer` sí. Por eso en los datos de entrada se usa
> `Integer stockMinimo`: si el usuario no lo manda, llega `null` y la validación `@NotNull` avisa.

## 3. Operadores y condiciones

```java
if (cantidad > cantidadActual) {
    throw new IllegalStateException("No alcanza");
} else if (cantidad == 0) {
    // ...
} else {
    cantidadActual -= cantidad;     // igual a: cantidadActual = cantidadActual - cantidad
}
```

| Operador | Significado |
|---|---|
| `==` (Java), `===` (TS) | igual |
| `!=`, `!==` | distinto |
| `>`, `<`, `>=`, `<=` | comparaciones |
| `&&` | Y (las dos condiciones) |
| `\|\|` | O (alguna) |
| `!` | NO (invierte) |
| `? :` | "si … entonces … si no …" en una línea: `activo ? 'Activo' : 'Inactivo'` |

> **Ojo:** en Java, para comparar textos se usa `a.equals(b)`, no `a == b`.

## 4. Bucles

Repetir algo para cada elemento:

```java
// Java: para cada lote de la lista
for (Lote lote : lotes) {
    if (restante == 0) break;      // break: salir del bucle
    int tomada = Math.min(restante, lote.getCantidadActual());
    lote.descontar(tomada);
    restante -= tomada;
}
```

```ts
// TypeScript
for (const linea of lineas) {
  total += linea.cantidad;
}
```

> **En el proyecto:** ese bucle Java es casi literal el corazón del FEFO, en
> `TransferenciaService.transferir`. Recorre los lotes (ya ordenados por vencimiento) y va tomando
> de cada uno hasta cubrir lo pedido.

## 5. Funciones (métodos)

Una **función** es un bloque de código con nombre que recibe datos (**parámetros**), hace algo y
puede **devolver** un resultado. En Java, a las funciones dentro de una clase se las llama
**métodos**.

```java
// recibe una fecha, devuelve verdadero o falso
public boolean estaVencido(LocalDate hoy) {
    return fechaVencimiento.isBefore(hoy);
}
```

```ts
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-AR').format(valor);
}
```

`void` (Java) quiere decir "no devuelve nada".

### Funciones flecha (lambdas)

Una forma corta de escribir una función, muy usada para pasar "qué hacer" a otra función:

```java
// Java: "para cada lote, dame el id del medicamento"
lote -> lote.getMedicamento().getId()
```

```ts
// TypeScript: "para cada medicamento, dame su nombre"
(m) => m.nombre
```

## 6. Clases y objetos

Una **clase** es un molde; un **objeto** es algo hecho con ese molde. La clase `Lote` dice qué
datos tiene un lote (atributos) y qué se puede hacer con él (métodos). Cada lote real (`L2345`,
`L2350`…) es un objeto.

```java
public class Lote {
    private int cantidadActual;          // atributo (dato)

    public void descontar(int cantidad) { // método (comportamiento)
        if (cantidad > cantidadActual) {
            throw new IllegalStateException("No alcanza");
        }
        cantidadActual -= cantidad;
    }
}

Lote lote = new Lote(/* datos */);       // crear un objeto con "new"
lote.descontar(20);                      // usarlo
```

### Encapsulamiento

`private` quiere decir que **nadie de afuera** puede tocar el atributo directamente. La única forma
de cambiar `cantidadActual` es con `descontar`, `ajustar` o `darDeBaja`, y esos métodos **controlan
las reglas**. Eso se llama **encapsulamiento**, y es lo que permite asegurar que el stock nunca sea
negativo: no hay otra puerta.

| Palabra | Quién puede usarlo |
|---|---|
| `public` | Cualquiera. |
| `private` | Solo la propia clase. |
| `protected` | La clase, sus hijas y su paquete. |
| (nada) | Solo las clases del mismo paquete (carpeta). |

### Constructor

Método especial que se ejecuta al crear el objeto con `new`. Sirve para que el objeto nazca
**válido**:

```java
public Lote(..., int cantidad, ...) {
    if (cantidad <= 0) {
        throw new IllegalArgumentException("La cantidad tiene que ser mayor a 0.");
    }
    this.cantidadInicial = cantidad;    // this = "este objeto"
    this.cantidadActual = cantidad;
}
```

### Getters y setters

Métodos para leer (`getNombre()`) o cambiar (`setNombre(...)`) un atributo privado. En el proyecto
los genera **Lombok** con las anotaciones `@Getter` y `@Setter`, para no escribirlos a mano. A
propósito, **`Lote` no tiene setters**: las cantidades solo cambian con sus métodos con reglas.

### Herencia e interfaces (lo justo)

- **Herencia** (`extends`): una clase toma todo de otra y agrega lo suyo.
  `ManejadorErrores extends ResponseEntityExceptionHandler` aprovecha el manejo de errores que ya
  trae Spring.
- **Interfaz** (`interface`): un contrato ("quien me implemente, tiene que tener estos métodos").
  `NotificadorRecuperacion` es una interfaz; `CorreoSimulado` la implementa. Mañana se puede
  escribir `CorreoReal` sin tocar el resto.

## 7. Excepciones (errores)

Cuando algo no puede seguir, el código **lanza** una excepción (`throw`). La ejecución se corta y
la excepción "sube" hasta que alguien la **atrapa** (`catch`).

```java
try {
    lote.descontar(500);
} catch (IllegalStateException e) {
    // manejar el error
}
```

> **En el proyecto:** los servicios lanzan excepciones propias con nombre claro
> (`RecursoNoEncontradoException`, `ReglaNegocioException`, `StockInsuficienteException`). **Nadie
> las atrapa en el medio**: suben hasta `ManejadorErrores`, que las convierte en una respuesta HTTP
> (404, 409…) con un mensaje en español. Así el manejo de errores está en un solo lugar.

## 8. Colecciones

| Colección | Para qué | Ejemplo |
|---|---|---|
| Lista (`List`) | Elementos en orden, se pueden repetir. | Los lotes de un medicamento. |
| Conjunto (`Set`) | Sin repetidos. | Los permisos de un rol. |
| Mapa (`Map`) | Clave → valor. | Id de medicamento → cantidad pedida. |

```java
Map<Long, Integer> cantidades = new LinkedHashMap<>();
cantidades.merge(5L, 10, Integer::sum);   // medicamento 5: 10
cantidades.merge(5L, 5, Integer::sum);    // medicamento 5: 10 + 5 = 15  (ítems repetidos se suman)
```

## 9. Null y Optional

`null` significa "no hay valor". Usarlo sin chequear produce el famoso `NullPointerException`. Java
tiene `Optional` para decir "puede que haya, puede que no":

```java
areaRepository.findById(id)        // devuelve Optional<Area>
    .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el área " + id + "."));
```

"Buscá el área; si no está, lanzá un 404."

## 10. Comentarios

```java
// comentario de una línea
/* comentario de
   varias líneas */
/** Javadoc: documenta una clase o método. */
```

```sql
-- comentario en SQL
```

> **En el proyecto:** la regla es comentar **por qué**, no **qué**. "El orden por id evita
> deadlocks" es útil; "suma uno a i" no.

## 11. Paquetes e imports

Las clases se agrupan en **paquetes** (carpetas). Para usar una clase de otro paquete, se la
**importa**:

```java
package ar.edu.utn.farmacia.transferencia;   // dónde vive esta clase

import ar.edu.utn.farmacia.lote.Lote;        // traigo Lote de otro paquete
```

En TypeScript es igual con archivos:

```ts
import { formatearFecha } from '../../utils/fechas';
```

## Resumen

| Concepto | En una frase |
|---|---|
| Variable | Caja con nombre y tipo. |
| Función / método | Bloque con nombre que recibe datos y devuelve un resultado. |
| Clase / objeto | Molde / cosa hecha con el molde. |
| Encapsulamiento | Los datos se cambian solo por métodos que controlan las reglas. |
| Excepción | Error que corta la ejecución y sube hasta que alguien lo maneja. |
| Lista / conjunto / mapa | Varios valores en orden / sin repetir / por clave. |
