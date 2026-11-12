package ar.edu.utn.farmacia.usuario;

import static ar.edu.utn.farmacia.common.Exportador.FECHA;

import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.Reporte;
import ar.edu.utn.farmacia.common.Reporte.Columna;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/** Sale de UsuarioResponse, que no tiene la contraseña ni su hash. */
final class UsuarioReporte {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Usuario", 14),
          Columna.texto("Nombre completo", 26),
          Columna.texto("Rol", 14),
          Columna.texto("Activo", 7),
          Columna.texto("Alta", 10));

  private UsuarioReporte() {}

  static Reporte generar(List<UsuarioResponse> usuarios, ZoneId zona, String q, Boolean activo) {
    List<List<String>> filas =
        usuarios.stream()
            .map(
                u ->
                    List.of(
                        u.username(),
                        u.nombreCompleto(),
                        texto(u.rol()),
                        Exportador.siNo(u.activo()),
                        u.creadoEn().atZoneSameInstant(zona).format(FECHA)))
            .toList();
    List<String> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      filtros.add("Búsqueda: " + q.strip());
    }
    filtros.add(Exportador.filtroActivo(activo));
    return new Reporte("Usuarios del sistema", filtros, COLUMNAS, filas);
  }

  static String texto(Rol rol) {
    return switch (rol) {
      case ADMIN -> "Administrador";
      case FARMACEUTICO -> "Farmacéutico";
      case CONSULTA -> "Consulta";
    };
  }
}
