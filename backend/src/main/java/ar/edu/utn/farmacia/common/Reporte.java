package ar.edu.utn.farmacia.common;

import java.util.List;

/**
 * Reporte tabular listo para exportar. Los servicios arman las filas ya formateadas y {@link
 * Exportador} decide el formato, así CSV y PDF muestran exactamente los mismos datos.
 *
 * @param filtros textos como "Estado: Sin stock", que el PDF muestra debajo del título
 */
public record Reporte(
    String titulo, List<String> filtros, List<Columna> columnas, List<List<String>> filas) {

  public Reporte {
    filtros = List.copyOf(filtros);
    columnas = List.copyOf(columnas);
    filas = List.copyOf(filas);
  }

  public List<String> encabezados() {
    return columnas.stream().map(Columna::nombre).toList();
  }

  /**
   * @param ancho peso relativo de la columna en el PDF
   */
  public record Columna(String nombre, boolean numerica, float ancho) {

    public static Columna texto(String nombre, float ancho) {
      return new Columna(nombre, false, ancho);
    }

    public static Columna numero(String nombre, float ancho) {
      return new Columna(nombre, true, ancho);
    }
  }
}
