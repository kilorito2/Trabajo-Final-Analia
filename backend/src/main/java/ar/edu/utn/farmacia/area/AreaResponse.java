package ar.edu.utn.farmacia.area;

import jakarta.validation.constraints.NotNull;

public record AreaResponse(@NotNull Long id, @NotNull String nombre, boolean activo) {

  public static AreaResponse desde(Area area) {
    return new AreaResponse(area.getId(), area.getNombre(), area.isActivo());
  }
}
