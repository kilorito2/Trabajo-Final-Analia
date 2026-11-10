package ar.edu.utn.farmacia.transferencia;

import static ar.edu.utn.farmacia.common.Exportador.FECHA;
import static ar.edu.utn.farmacia.common.Exportador.FECHA_HORA;

import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import ar.edu.utn.farmacia.lote.Lote;
import java.time.ZoneId;
import java.util.List;

final class TransferenciaReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Número", 8),
          Columna.texto("Fecha y hora", 10),
          Columna.texto("Área", 11),
          Columna.texto("Realizada por", 11),
          Columna.texto("Código", 7),
          Columna.texto("Medicamento", 18),
          Columna.texto("Lote", 7),
          Columna.texto("Vencimiento", 8),
          Columna.numero("Cantidad", 6),
          Columna.texto("Observaciones", 14));

  private TransferenciaReporte() {}

  /** Una fila por línea de detalle. */
  static Reporte generar(List<DetalleTransferencia> lineas, ZoneId zona, List<String> filtros) {
    List<List<String>> filas = lineas.stream().map(linea -> fila(linea, zona)).toList();
    return new Reporte("Transferencias a áreas", filtros, COLUMNAS, filas);
  }

  private static List<String> fila(DetalleTransferencia linea, ZoneId zona) {
    Transferencia transferencia = linea.getTransferencia();
    Lote lote = linea.getLote();
    return List.of(
        Transferencia.numero(transferencia.getId()),
        transferencia.getFechaHora().atZoneSameInstant(zona).format(FECHA_HORA),
        transferencia.getArea().getNombre(),
        transferencia.getRealizadaPor().getNombreCompleto(),
        lote.getMedicamento().getCodigo(),
        lote.getMedicamento().descripcion(),
        lote.getNumeroLote(),
        lote.getFechaVencimiento().format(FECHA),
        String.valueOf(linea.getCantidad()),
        transferencia.getObservaciones() == null ? "" : transferencia.getObservaciones());
  }
}
