package ar.edu.utn.farmacia.medicamento;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import java.util.ArrayList;
import java.util.List;

final class MedicamentoReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Código", 10),
          Columna.texto("Nombre", 22),
          Columna.texto("Presentación", 22),
          Columna.numero("Stock total", 10),
          Columna.numero("Stock mínimo", 10),
          Columna.texto("Próximo vencimiento", 13),
          Columna.texto("Estado", 10),
          Columna.texto("Activo", 7));

  private MedicamentoReporte() {}

  static Reporte generar(List<MedicamentoConStock> medicamentos, FiltroMedicamentos filtro) {
    List<List<String>> filas =
        medicamentos.stream()
            .map(
                m ->
                    List.of(
                        m.codigo(),
                        m.nombre(),
                        m.presentacion(),
                        String.valueOf(m.stockTotal()),
                        String.valueOf(m.stockMinimo()),
                        m.proximoVencimiento() == null
                            ? ""
                            : m.proximoVencimiento().format(Exportador.FECHA),
                        texto(m.estado()),
                        Exportador.siNo(m.activo())))
            .toList();
    return new Reporte("Stock de medicamentos", filtros(filtro), COLUMNAS, filas);
  }

  static String texto(EstadoStock estado) {
    return switch (estado) {
      case SIN_STOCK -> "Sin stock";
      case STOCK_BAJO -> "Stock bajo";
      case OK -> "OK";
    };
  }

  private static List<String> filtros(FiltroMedicamentos filtro) {
    List<String> filtros = new ArrayList<>();
    if (filtro.q() != null && !filtro.q().isBlank()) {
      filtros.add("Búsqueda: " + filtro.q().strip());
    }
    if (filtro.estado() != null) {
      filtros.add("Estado: " + texto(filtro.estado()));
    }
    filtros.add(Exportador.filtroActivo(filtro.activo()));
    return filtros;
  }
}
