package ar.edu.utn.farmacia.proveedor;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import java.util.ArrayList;
import java.util.List;

final class ProveedorReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Razón social", 26),
          Columna.texto("CUIT", 13),
          Columna.texto("Teléfono", 13),
          Columna.texto("Correo", 22),
          Columna.numero("Lotes con stock", 10),
          Columna.texto("Activo", 7));

  private ProveedorReporte() {}

  static Reporte generar(List<ProveedorResponse> proveedores, String q, Boolean activo) {
    List<List<String>> filas =
        proveedores.stream()
            .map(
                p ->
                    List.of(
                        p.razonSocial(),
                        p.cuit(),
                        p.telefono() == null ? "" : p.telefono(),
                        p.email() == null ? "" : p.email(),
                        String.valueOf(p.lotesConStock()),
                        Exportador.siNo(p.activo())))
            .toList();
    List<String> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      filtros.add("Búsqueda: " + q.strip());
    }
    filtros.add(Exportador.filtroActivo(activo));
    return new Reporte("Proveedores", filtros, COLUMNAS, filas);
  }
}
