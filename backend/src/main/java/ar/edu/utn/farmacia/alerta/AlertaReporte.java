package ar.edu.utn.farmacia.alerta;

import static ar.edu.utn.farmacia.common.Exportador.FECHA;

import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import java.util.ArrayList;
import java.util.List;

/** En el mismo orden que el panel: vencidos, sin stock, por vencer y stock bajo. */
final class AlertaReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Alerta", 11),
          Columna.texto("Medicamento", 26),
          Columna.texto("Lote", 9),
          Columna.texto("Vencimiento", 10),
          Columna.numero("Días", 6),
          Columna.numero("Cantidad o stock", 10),
          Columna.numero("Stock mínimo", 9));

  private AlertaReporte() {}

  static Reporte generar(AlertasResponse alertas) {
    List<List<String>> filas = new ArrayList<>();
    alertas.vencidos().forEach(lote -> filas.add(fila("Vencido", lote)));
    alertas.sinStock().forEach(medicamento -> filas.add(fila("Sin stock", medicamento)));
    alertas.porVencer().forEach(lote -> filas.add(fila("Por vencer", lote)));
    alertas.stockBajo().forEach(medicamento -> filas.add(fila("Stock bajo", medicamento)));
    List<String> filtros =
        List.of("Por vencer: dentro de los próximos " + alertas.diasPorVencer() + " días");
    return new Reporte("Alertas de stock y vencimientos", filtros, COLUMNAS, filas);
  }

  private static List<String> fila(String alerta, AlertaLote lote) {
    return List.of(
        alerta,
        lote.medicamento(),
        lote.numeroLote(),
        lote.fechaVencimiento().format(FECHA),
        String.valueOf(lote.diasParaVencer()),
        String.valueOf(lote.cantidadActual()),
        "");
  }

  private static List<String> fila(String alerta, AlertaMedicamento medicamento) {
    return List.of(
        alerta,
        medicamento.nombre() + " " + medicamento.presentacion(),
        "",
        "",
        "",
        String.valueOf(medicamento.stockTotal()),
        String.valueOf(medicamento.stockMinimo()));
  }
}
