package ar.edu.utn.farmacia.lote;

import static ar.edu.utn.farmacia.common.Exportador.FECHA;
import static ar.edu.utn.farmacia.common.Exportador.FECHA_HORA;

import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import ar.edu.utn.farmacia.transferencia.Transferencia;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

final class MovimientoReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Fecha y hora", 13),
          Columna.texto("Tipo", 12),
          Columna.texto("Medicamento", 22),
          Columna.texto("Lote", 9),
          Columna.numero("Cantidad", 8),
          Columna.numero("Saldo", 8),
          Columna.texto("Usuario", 11),
          Columna.texto("Transferencia o motivo", 20));

  private MovimientoReporte() {}

  static Reporte generar(
      List<MovimientoResponse> movimientos,
      ZoneId zona,
      String medicamento,
      TipoMovimiento tipo,
      LocalDate desde,
      LocalDate hasta) {
    List<List<String>> filas =
        movimientos.stream()
            .map(
                m ->
                    List.of(
                        m.fechaHora().atZoneSameInstant(zona).format(FECHA_HORA),
                        texto(m.tipo()),
                        m.medicamento(),
                        m.numeroLote(),
                        String.valueOf(m.cantidad()),
                        String.valueOf(m.saldoResultante()),
                        m.usuario(),
                        detalle(m)))
            .toList();
    List<String> filtros = new ArrayList<>();
    if (medicamento != null) {
      filtros.add("Medicamento: " + medicamento);
    }
    if (tipo != null) {
      filtros.add("Tipo: " + texto(tipo));
    }
    if (desde != null) {
      filtros.add("Desde: " + desde.format(FECHA));
    }
    if (hasta != null) {
      filtros.add("Hasta: " + hasta.format(FECHA));
    }
    return new Reporte("Movimientos de stock", filtros, COLUMNAS, filas);
  }

  static String texto(TipoMovimiento tipo) {
    return switch (tipo) {
      case INGRESO -> "Ingreso";
      case EGRESO -> "Egreso";
      case BAJA_VENCIMIENTO -> "Baja por vencimiento";
      case AJUSTE -> "Ajuste";
    };
  }

  private static String detalle(MovimientoResponse movimiento) {
    if (movimiento.transferenciaId() != null) {
      return Transferencia.numero(movimiento.transferenciaId());
    }
    return movimiento.motivo() == null ? "" : movimiento.motivo();
  }
}
