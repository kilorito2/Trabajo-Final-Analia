package ar.edu.utn.farmacia.transferencia;

import ar.edu.utn.farmacia.common.Csv;
import ar.edu.utn.farmacia.lote.Lote;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

final class TransferenciaCsv {

  private static final List<String> ENCABEZADO =
      List.of(
          "Número",
          "Fecha y hora",
          "Área",
          "Realizada por",
          "Código",
          "Medicamento",
          "Lote",
          "Vencimiento",
          "Cantidad",
          "Observaciones");

  private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  private static final DateTimeFormatter FECHA_HORA =
      DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

  private TransferenciaCsv() {}

  /** BOM UTF-8 al principio para que Excel muestre bien las tildes. */
  static byte[] generar(List<DetalleTransferencia> lineas, ZoneId zona) {
    StringBuilder csv = new StringBuilder(Csv.BOM).append(Csv.linea(ENCABEZADO));
    for (DetalleTransferencia linea : lineas) {
      Transferencia transferencia = linea.getTransferencia();
      Lote lote = linea.getLote();
      csv.append(
          Csv.linea(
              List.of(
                  Transferencia.numero(transferencia.getId()),
                  transferencia.getFechaHora().atZoneSameInstant(zona).format(FECHA_HORA),
                  transferencia.getArea().getNombre(),
                  transferencia.getRealizadaPor().getNombreCompleto(),
                  lote.getMedicamento().getCodigo(),
                  lote.getMedicamento().descripcion(),
                  lote.getNumeroLote(),
                  lote.getFechaVencimiento().format(FECHA),
                  String.valueOf(linea.getCantidad()),
                  transferencia.getObservaciones() == null
                      ? ""
                      : transferencia.getObservaciones())));
    }
    return csv.toString().getBytes(StandardCharsets.UTF_8);
  }
}
