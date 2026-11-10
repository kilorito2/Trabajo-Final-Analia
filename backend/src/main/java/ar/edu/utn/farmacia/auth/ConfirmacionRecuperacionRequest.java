package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ConfirmacionRecuperacionRequest(
    @NotBlank(message = "Ingresá tu usuario.") @Size(max = 50) String username,
    @NotBlank(message = "Ingresá el código que recibiste.")
        @Pattern(regexp = "[0-9]{6}", message = "El código tiene 6 números.")
        String codigo,
    @NotBlank(message = "Ingresá la contraseña nueva.")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
        String passwordNueva) {

  @Override
  public String toString() {
    return "ConfirmacionRecuperacionRequest[username=" + username + ", ***]";
  }
}
