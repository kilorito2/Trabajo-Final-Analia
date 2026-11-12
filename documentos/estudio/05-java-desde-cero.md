# 05 — Java desde cero (lo que usa el proyecto)

Java es el lenguaje del backend. Usamos **Java 21**, una versión de soporte extendido (LTS).
Este archivo explica las partes del lenguaje que aparecen en el código del proyecto, con ejemplos
del propio proyecto.

## 1. Estructura de un archivo

```java
package ar.edu.utn.farmacia.area;          // 1. en qué paquete (carpeta) está

import jakarta.persistence.Entity;          // 2. qué clases de otros paquetes usa

@Entity                                     // 3. anotaciones (etiquetas)
public class Area {                         // 4. la clase; el archivo se llama igual: Area.java
    private Long id;                        // atributos
    private String nombre;

    public Area(String nombre) { ... }      // constructor
    public String getNombre() { ... }       // métodos
}
```

- Un archivo `.java` = una clase pública con el mismo nombre.
- El nombre del paquete sigue al revés el dominio de la organización: `ar.edu.utn` + `farmacia`.
- Las llaves `{ }` delimitan bloques; cada instrucción termina con `;`.

## 2. Tipos primitivos y "envoltorios"

| Primitivo | Envoltorio (puede ser `null`) | Uso |
|---|---|---|
| `int` | `Integer` | Enteros (cantidades). |
| `long` | `Long` | Enteros grandes (ids, sumas). |
| `boolean` | `Boolean` | Verdadero/falso. |
| `double` | `Double` | Decimales (no se usa para dinero). |

Los ids son `Long` (con mayúscula) porque un objeto recién creado todavía no tiene id: vale `null`
hasta que la base se lo asigna.

## 3. Strings

```java
String detalle = "No existe el medicamento " + id + ".";   // concatenar con +
nombre.strip();                 // quita espacios al principio y al final
codigo.toUpperCase(Locale.ROOT) // a mayúsculas
texto.isBlank();                // ¿está vacío o son solo espacios?
a.equals(b);                    // comparar textos (¡no usar ==!)
```

**Text blocks** (texto de varias líneas, Java 15+), usados para el SQL:

```java
String sql = """
    select l from Lote l
    where l.cantidadActual > 0
    order by l.id
    """;
```

## 4. Fechas (java.time)

| Clase | Qué representa | Ejemplo |
|---|---|---|
| `LocalDate` | Un día, sin hora ni zona. | Vencimiento: `2026-11-30`. |
| `OffsetDateTime` | Un instante con su diferencia horaria. | `2026-11-09T17:49:00-03:00`. |
| `Instant` | Un instante absoluto (UTC). | Vencimiento del token. |
| `Duration` | Una duración. | `8h` (duración del token). |
| `Clock` | "Reloj" del que se saca la hora actual. | Con zona de Buenos Aires. |
| `ZoneId` | Zona horaria. | `America/Argentina/Buenos_Aires`. |

```java
LocalDate hoy = LocalDate.now(clock);           // "hoy" según el reloj inyectado
fechaVencimiento.isBefore(hoy);                 // ¿venció?
hoy.plusDays(30);                               // dentro de 30 días
ChronoUnit.DAYS.between(desde, hasta);          // días entre dos fechas
```

> **En el proyecto:** **nunca** `LocalDate.now()` sin el reloj. El servidor corre en UTC; a las
> 21:00 de Argentina en UTC ya es mañana y los lotes que vencen hoy aparecerían vencidos. Con
> `LocalDate.now(clock)` y un `Clock` configurado con la zona de Buenos Aires, "hoy" es siempre el
> de Argentina. Y en las pruebas se usa un reloj fijo.

## 5. Clases, constructores y `this`

```java
public class Area {
    private Long id;
    private String nombre;
    private boolean activo;

    protected Area() {}             // constructor vacío: lo necesita JPA (ver Spring)

    public Area(String nombre) {    // constructor que usa el código
        this.nombre = nombre;       // this.nombre = el atributo; nombre = el parámetro
        this.activo = true;         // toda área nace activa
    }
}
```

## 6. Records: clases de datos inmutables

Un **record** (Java 16+) es una clase corta para **transportar datos**. Java genera solo el
constructor, los métodos para leer cada campo, `equals`, `hashCode` y `toString`. No se puede
modificar después de creado (**inmutable**).

```java
public record AreaResponse(Long id, String nombre, boolean activo) {

    // método estático "de fábrica": convierte la entidad en la respuesta
    public static AreaResponse desde(Area area) {
        return new AreaResponse(area.getId(), area.getNombre(), area.isActivo());
    }
}

AreaResponse r = AreaResponse.desde(area);
r.nombre();        // se lee con nombre(), no getNombre()
```

### Constructor compacto

Se ejecuta antes de guardar los valores; sirve para **normalizar**:

```java
public record MedicamentoRequest(String codigo, String nombre, String presentacion, Integer stockMinimo) {
    public MedicamentoRequest {
        codigo = codigo == null ? null : codigo.strip().toUpperCase(Locale.ROOT);  // "amox-500 " → "AMOX-500"
        nombre = Textos.limpiar(nombre);
    }
}
```

> **En el proyecto:** todos los DTO (`...Request`, `...Response`) son records. Las entidades
> (`Area`, `Lote`…) son clases comunes porque JPA necesita poder crearlas vacías y modificarlas.

## 7. Enums: listas cerradas de valores

```java
public enum Permiso {
    LECTURA, CATALOGO_EDITAR, STOCK_INGRESAR, STOCK_BAJA_AJUSTE, TRANSFERENCIA_CREAR, USUARIO_GESTIONAR
}
```

Un enum puede tener datos y métodos. El enum `Rol` guarda los permisos de cada rol (es **el único
lugar** del sistema donde se define qué puede hacer cada rol):

```java
public enum Rol {
    ADMIN(EnumSet.allOf(Permiso.class)),                    // todos los permisos
    FARMACEUTICO(EnumSet.of(Permiso.LECTURA, Permiso.CATALOGO_EDITAR, Permiso.STOCK_INGRESAR,
                            Permiso.STOCK_BAJA_AJUSTE, Permiso.TRANSFERENCIA_CREAR)),
    CONSULTA(EnumSet.of(Permiso.LECTURA));

    private final Set<Permiso> permisos;
    Rol(Set<Permiso> permisos) { this.permisos = permisos; }
    public Set<Permiso> permisos() { return permisos; }
}

Rol.CONSULTA.permisos();   // [LECTURA]
```

Otros enums del proyecto: `TipoMovimiento` (INGRESO, EGRESO, BAJA_VENCIMIENTO, AJUSTE),
`EstadoLote` (VIGENTE, POR_VENCER, VENCIDO, AGOTADO), `EstadoStock` (SIN_STOCK, STOCK_BAJO, OK),
`FormatoReporte` (CSV, XLSX, PDF).

## 8. Interfaces

```java
/** Cómo le llega el código al usuario. Hoy es simulado; un envío por correo real lo reemplaza. */
public interface NotificadorRecuperacion {
    void enviarCodigo(Usuario usuario, String codigo, Duration vigencia);
}

@Component
class CorreoSimulado implements NotificadorRecuperacion {
    public void enviarCodigo(Usuario usuario, String codigo, Duration vigencia) {
        // solo deja constancia en el log (sin el código)
    }
}
```

`RecuperacionService` depende de la **interfaz**, no de `CorreoSimulado`. Para enviar correos
reales alcanza con escribir otra clase que implemente la interfaz.

Los **repositorios** también son interfaces, pero no hace falta implementarlas: Spring lo hace
(ver el archivo 06).

## 9. Genéricos `<T>`

Los `< >` dicen "de qué tipo son los elementos":

```java
List<Lote> lotes;                  // lista de lotes
Map<Long, Integer> cantidades;     // de Long (id) a Integer (cantidad)
Optional<Area> area;               // puede haber un Area o no
Page<AreaResponse> pagina;         // una página de respuestas
```

## 10. Colecciones y streams

Un **stream** es una "cadena de montaje" para procesar colecciones: filtrar, transformar, ordenar,
agrupar, sumar.

```java
// De TransferenciaService: los lotes bloqueados → filtrados → ordenados FEFO → agrupados por medicamento
Map<Long, List<Lote>> lotes =
    loteRepository.bloquearDisponibles(cantidades.keySet(), hoy).stream()
        .filter(lote -> lote.tieneStock() && !lote.estaVencido(hoy))   // quedarse con los útiles
        .sorted(ORDEN_FEFO)                                            // ordenar por vencimiento…
        .collect(Collectors.groupingBy(lote -> lote.getMedicamento().getId()));  // agrupar
```

| Operación | Qué hace |
|---|---|
| `.filter(cond)` | Deja pasar solo los que cumplen. |
| `.map(f)` | Transforma cada elemento (por ejemplo, entidad → DTO). |
| `.sorted(comparador)` | Ordena. |
| `.mapToLong(...).sum()` | Suma. |
| `.toList()` | Junta el resultado en una lista. |
| `.collect(groupingBy(...))` | Agrupa en un mapa. |

### Comparadores

```java
static final Comparator<Lote> ORDEN_FEFO =
    Comparator.comparing(Lote::getFechaVencimiento)    // primero por vencimiento
        .thenComparing(Lote::getFechaIngreso)          // si empatan, por fecha de ingreso
        .thenComparing(Lote::getId);                   // si siguen empatados, por id
```

`Lote::getFechaVencimiento` es una **referencia a método**: igual a `lote -> lote.getFechaVencimiento()`.

## 11. Optional

```java
Optional<Area> resultado = areaRepository.findById(7L);

Area area = resultado.orElseThrow(
    () -> new RecursoNoEncontradoException("No se encontró el área 7."));
```

Obliga a pensar en el caso "no está". La regla del proyecto: nunca `Optional.get()` sin chequear.

## 12. Excepciones del proyecto

```java
// Lanzar
throw new ReglaNegocioException("AREA_INACTIVA", "El área Guardia está inactiva.");
```

| Excepción | Cuándo | Se convierte en |
|---|---|---|
| `RecursoNoEncontradoException` | No existe lo buscado. | 404 `NO_ENCONTRADO` |
| `ReglaNegocioException(codigo, mensaje)` | Viola una regla. | 409 con ese `codigo` |
| `StockInsuficienteException(faltantes)` | No alcanza el stock. | 409 `STOCK_INSUFICIENTE` + faltantes |
| `ErrorDeCampoException(campo, mensaje)` | Un campo es inválido según una regla del servicio. | 400 `VALIDACION` con `errors.campo` |
| `ParametroInvalidoException` | Parámetro de la URL inválido. | 400 |
| `IllegalArgumentException` / `IllegalStateException` | Invariante de una entidad violada (no debería pasar). | 500 |

Hay dos familias en Java: **checked** (el compilador obliga a declararlas) y **unchecked**
(heredan de `RuntimeException`, no hace falta declararlas). Las del proyecto son unchecked.

## 13. Anotaciones

Las **anotaciones** (`@Algo`) son etiquetas que no hacen nada por sí solas: las lee otro programa
(Spring, JPA, Lombok, el validador) y actúa en consecuencia.

```java
@Entity                 // JPA: "esta clase es una tabla"
@Getter                 // Lombok: "generá los getters"
public class Area { ... }

@NotBlank(message = "Ingresá el nombre del área.")   // validador: no puede estar vacío
String nombre
```

En el archivo 06 está la lista de todas las anotaciones del proyecto.

## 14. Lombok

Biblioteca que **genera código repetitivo** al compilar. En el proyecto se usa solo:

| Anotación | Genera |
|---|---|
| `@Getter` | Un `getX()` por atributo (o `isX()` para boolean). |
| `@Setter` | Un `setX(...)`, solo en los atributos que pueden cambiar. |
| `@RequiredArgsConstructor` | Un constructor con todos los atributos `final`. Spring lo usa para inyectar dependencias. |

**Prohibido** `@Data` en entidades: genera métodos que pueden imprimir relaciones enteras o el hash
de la contraseña y romper con JPA.

## 15. `final` y `static`

- `final` en un atributo: se asigna una vez y no cambia. Las dependencias de un servicio son
  `private final`.
- `static`: pertenece a la clase, no a cada objeto. Constantes (`static final int
  DIAS_MAXIMOS_EXPORTACION = 366`) y métodos de fábrica (`AreaResponse.desde(...)`).

## 16. Cómo leer una clase del proyecto sin perderse

1. Mirá el **paquete** (de qué tema es).
2. Mirá las **anotaciones de la clase** (`@Entity`, `@Service`, `@RestController`): te dicen qué
   rol cumple.
3. Mirá los **atributos `private final`**: son sus dependencias (con qué otras clases trabaja).
4. Mirá los **métodos públicos**: son lo que ofrece. Los privados son ayudantes.
5. Leé los **comentarios**: explican los "por qué".

Probalo con `backend/src/main/java/ar/edu/utn/farmacia/area/AreaService.java`: es corto y tiene
todo esto.
