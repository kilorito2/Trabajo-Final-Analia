package ar.edu.utn.farmacia.common;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.regex.Pattern;
import org.dhatim.fastexcel.Workbook;
import org.dhatim.fastexcel.Worksheet;

/**
 * Planilla de Excel (.xlsx) de los reportes: título, filtros, encabezado con color, filtros de
 * columna y anchos ajustados al contenido. A diferencia del CSV, las cantidades quedan como números
 * y las fechas como fechas, así se pueden ordenar y sumar en Excel.
 */
final class ReporteXlsx {

  private static final String PRIMARIO = "0A6170";
  private static final String FONDO_ALTERNADO = "F2F6F8";
  private static final int FILA_ENCABEZADO = 3;
  private static final Pattern ENTERO = Pattern.compile("-?\\d{1,15}");
  private static final Pattern FECHA = Pattern.compile("\\d{2}/\\d{2}/\\d{4}");
  private static final Pattern FECHA_HORA = Pattern.compile("\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}");

  private ReporteXlsx() {}

  static byte[] generar(Reporte reporte, String generadoEn) {
    ByteArrayOutputStream salida = new ByteArrayOutputStream();
    try {
      Workbook libro = new Workbook(salida, "Farmacia Hospitalaria", "1.0");
      Worksheet hoja = libro.newWorksheet(nombreDeHoja(reporte.titulo()));
      int ultimaColumna = reporte.columnas().size() - 1;

      hoja.value(0, 0, reporte.titulo());
      hoja.style(0, 0).bold().fontSize(14).fontColor(PRIMARIO).set();
      String detalle = String.join("  ·  ", reporte.filtros());
      hoja.value(1, 0, detalle.isEmpty() ? generadoEn : detalle + "  ·  " + generadoEn);
      hoja.style(1, 0).italic().fontColor("4D5D6B").set();

      for (int c = 0; c <= ultimaColumna; c++) {
        Reporte.Columna columna = reporte.columnas().get(c);
        hoja.value(FILA_ENCABEZADO, c, columna.nombre());
        hoja.style(FILA_ENCABEZADO, c)
            .bold()
            .fontColor("FFFFFF")
            .fillColor(PRIMARIO)
            .horizontalAlignment(columna.numerica() ? "right" : "left")
            .set();
      }

      List<List<String>> filas = reporte.filas();
      for (int f = 0; f < filas.size(); f++) {
        int fila = FILA_ENCABEZADO + 1 + f;
        for (int c = 0; c <= ultimaColumna; c++) {
          escribir(hoja, fila, c, filas.get(f).get(c), reporte.columnas().get(c));
          if (f % 2 == 1) {
            hoja.style(fila, c).fillColor(FONDO_ALTERNADO).set();
          }
        }
      }

      for (int c = 0; c <= ultimaColumna; c++) {
        hoja.width(c, ancho(reporte, c));
      }
      hoja.freezePane(0, FILA_ENCABEZADO + 1);
      if (!filas.isEmpty()) {
        hoja.setAutoFilter(FILA_ENCABEZADO, 0, ultimaColumna);
      }
      libro.finish();
    } catch (IOException ex) {
      throw new UncheckedIOException("No se pudo generar la planilla " + reporte.titulo(), ex);
    }
    return salida.toByteArray();
  }

  /** Números como números y fechas como fechas; el resto, texto tal cual. */
  private static void escribir(
      Worksheet hoja, int fila, int columna, String valor, Reporte.Columna definicion) {
    if (valor == null || valor.isEmpty()) {
      return;
    }
    try {
      if (definicion.numerica() && ENTERO.matcher(valor).matches()) {
        hoja.value(fila, columna, Long.parseLong(valor));
        return;
      }
      if (FECHA_HORA.matcher(valor).matches()) {
        hoja.value(fila, columna, LocalDateTime.parse(valor, Exportador.FECHA_HORA));
        hoja.style(fila, columna).format("dd/mm/yyyy hh:mm").set();
        return;
      }
      if (FECHA.matcher(valor).matches()) {
        hoja.value(fila, columna, LocalDate.parse(valor, Exportador.FECHA));
        hoja.style(fila, columna).format("dd/mm/yyyy").set();
        return;
      }
    } catch (DateTimeParseException ex) {
      // No era una fecha válida: se escribe como texto.
    }
    hoja.value(fila, columna, valor);
  }

  /** Ancho según el texto más largo de la columna, con un mínimo y un máximo razonables. */
  private static double ancho(Reporte reporte, int columna) {
    int mayor = reporte.columnas().get(columna).nombre().length();
    for (List<String> fila : reporte.filas()) {
      String valor = fila.get(columna);
      mayor = Math.max(mayor, valor == null ? 0 : valor.length());
    }
    return Math.min(Math.max(mayor + 3, 10), 60);
  }

  // Excel no acepta más de 31 caracteres ni algunos símbolos en el nombre de la hoja.
  private static String nombreDeHoja(String titulo) {
    String limpio = titulo.replaceAll("[\\\\/?*\\[\\]:]", " ").strip();
    return limpio.length() > 31 ? limpio.substring(0, 31) : limpio;
  }
}
