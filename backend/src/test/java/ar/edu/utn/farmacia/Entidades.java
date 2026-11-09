package ar.edu.utn.farmacia;

import ar.edu.utn.farmacia.area.Area;
import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.common.FarmaciaProperties;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.proveedor.Proveedor;
import ar.edu.utn.farmacia.usuario.Usuario;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.test.util.ReflectionTestUtils;

/** Entidades armadas a mano para los tests unitarios (con id, como si vinieran de la base). */
public final class Entidades {

  public static final int DIAS_POR_VENCER = 30;

  private Entidades() {}

  public static <T> T conId(T entidad, Long id) {
    ReflectionTestUtils.setField(entidad, "id", id);
    return entidad;
  }

  public static FarmaciaProperties propiedades() {
    return new FarmaciaProperties(
        "America/Argentina/Buenos_Aires",
        new FarmaciaProperties.Alertas(DIAS_POR_VENCER),
        new FarmaciaProperties.Cors(List.of()),
        new FarmaciaProperties.Admin(null),
        new FarmaciaProperties.Demo("demo1234"));
  }

  public static Usuario usuario(Long id) {
    return conId(
        new Usuario(
            "usuario" + id,
            "Usuario " + id,
            "$2a$12$hash",
            Rol.FARMACEUTICO,
            OffsetDateTime.now(RelojFijoConfig.reloj())),
        id);
  }

  public static Area area(Long id, boolean activa) {
    Area area = conId(new Area("Área " + id), id);
    area.setActivo(activa);
    return area;
  }

  public static Medicamento medicamento(Long id, int stockMinimo, boolean activo) {
    Medicamento medicamento =
        conId(new Medicamento("COD-" + id, "Remedio" + id, "ampolla 1 g", stockMinimo), id);
    medicamento.setActivo(activo);
    return medicamento;
  }

  public static Proveedor proveedor(Long id, boolean activo) {
    Proveedor proveedor = conId(new Proveedor("Proveedor " + id, "30711111119", null, null), id);
    proveedor.setActivo(activo);
    return proveedor;
  }

  public static Lote lote(
      Long id, Medicamento medicamento, LocalDate vencimiento, LocalDate ingreso, int cantidad) {
    return conId(
        new Lote(
            medicamento,
            proveedor(1L, true),
            "L" + id,
            vencimiento,
            cantidad,
            ingreso,
            usuario(99L),
            OffsetDateTime.now(RelojFijoConfig.reloj())),
        id);
  }
}
