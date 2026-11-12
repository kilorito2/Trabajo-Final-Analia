package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

final class LoteReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Medicamento", 24),
          Columna.texto("Lote", 9),
          Columna.texto("Proveedor", 18),
          Columna.texto("Vencimiento", 10),
          Columna.numero("Días", 6),
          Columna.numero("Cantidad actual", 9),
          Columna.numero("Cantidad inicial", 9),
          Columna.texto("Ingreso", 9),
          Columna.texto("Estado", 9));

  private LoteReporte() {}

  static Reporte generar(List<LoteResponse> lotes, String q, Set<EstadoLote> estados) {
    List<List<String>> filas =
        lotes.stream()
            .map(
                lote ->
                    List.of(
                        lote.medicamento(),
                        lote.numeroLote(),
                        lote.proveedor(),
                        lote.fechaVencimiento().format(Exportador.FECHA),
                        String.valueOf(lote.diasParaVencer()),
                        String.valueOf(lote.cantidadActual()),
                        String.valueOf(lote.cantidadInicial()),
                        lote.fechaIngreso().format(Exportador.FECHA),
                        texto(lote.estado())))
            .toList();
    return new Reporte("Lotes y vencimientos", filtros(q, estados), COLUMNAS, filas);
  }

  static String texto(EstadoLote estado) {
    return switch (estado) {
      case VIGENTE -> "Vigente";
      case POR_VENCER -> "Por vencer";
      case VENCIDO -> "Vencido";
      case AGOTADO -> "Agotado";
    };
  }

  private static List<String> filtros(String q, Set<EstadoLote> estados) {
    List<String> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      filtros.add("Búsqueda: " + q.strip());
    }
    filtros.add("Estado: " + estados(estados));
    return filtros;
  }

  private static String estados(Set<EstadoLote> estados) {
    if (estados == null || estados.isEmpty()) {
      return "todos";
    }
    // El orden del enum, no el del pedido, para que el texto sea siempre el mismo.
    return Arrays.stream(EstadoLote.values())
        .filter(estados::contains)
        .map(LoteReporte::texto)
        .collect(Collectors.joining(", "));
  }
}
