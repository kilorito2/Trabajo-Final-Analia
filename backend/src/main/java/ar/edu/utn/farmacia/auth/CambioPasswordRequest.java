package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambioPasswordRequest(
    @NotBlank(message = "Ingresá tu contraseña actual.") String passwordActual,
    @NotBlank(message = "Ingresá la contraseña nueva.")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
        String passwordNueva) {

  @Override
  public String toString() {
    return "CambioPasswordRequest[***]";
  }
}
