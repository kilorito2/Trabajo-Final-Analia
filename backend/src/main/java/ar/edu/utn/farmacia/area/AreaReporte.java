package ar.edu.utn.farmacia.area;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import java.util.ArrayList;
import java.util.List;

final class AreaReporte {

  private static final List<Columna> COLUMNAS =
      List.of(Columna.texto("Área", 30), Columna.texto("Activa", 8));

  private AreaReporte() {}

  static Reporte generar(List<AreaResponse> areas, String q, Boolean activo) {
    List<List<String>> filas =
        areas.stream().map(a -> List.of(a.nombre(), Exportador.siNo(a.activo()))).toList();
    List<String> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      filtros.add("Búsqueda: " + q.strip());
    }
    filtros.add(Exportador.filtroActivo(activo));
    return new Reporte("Áreas del hospital", filtros, COLUMNAS, filas);
  }
}
