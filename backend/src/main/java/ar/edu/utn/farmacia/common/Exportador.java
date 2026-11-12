package ar.edu.utn.farmacia.common;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/** Convierte un {@link Reporte} al formato pedido y arma la descarga. */
@Component
@RequiredArgsConstructor
public class Exportador {

  public static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  public static final DateTimeFormatter FECHA_HORA =
      DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

  private final Clock clock;

  public byte[] generar(Reporte reporte, FormatoReporte formato) {
    return switch (formato) {
      case CSV -> csv(reporte);
      case XLSX -> ReporteXlsx.generar(reporte, generadoEn());
      case PDF -> ReportePdf.generar(reporte, generadoEn());
    };
  }

  /** "Generado el dd/mm/aaaa hh:mm", con la hora de Buenos Aires. */
  public String generadoEn() {
    return "Generado el " + ZonedDateTime.now(clock).format(FECHA_HORA);
  }

  /** Sin el filtro "activo", los listados incluyen los dados de baja. */
  public static String filtroActivo(Boolean activo) {
    if (activo == null) {
      return "Incluye inactivos";
    }
    return activo ? "Solo activos" : "Solo inactivos";
  }

  public static String siNo(boolean valor) {
    return valor ? "Sí" : "No";
  }

  public static ResponseEntity<byte[]> descarga(
      byte[] contenido, String nombreBase, FormatoReporte formato) {
    String archivo = nombreBase + "." + formato.extension();
    return ResponseEntity.ok()
        .contentType(formato.tipo())
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(archivo).build().toString())
        .body(contenido);
  }

  /** BOM UTF-8 al principio para que Excel muestre bien las tildes. */
  static byte[] csv(Reporte reporte) {
    StringBuilder csv = new StringBuilder(Csv.BOM).append(Csv.linea(reporte.encabezados()));
    reporte.filas().forEach(fila -> csv.append(Csv.linea(fila)));
    return csv.toString().getBytes(StandardCharsets.UTF_8);
  }
}
