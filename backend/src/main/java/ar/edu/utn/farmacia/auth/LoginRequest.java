package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Ingresá el usuario.") String username,
    @NotBlank(message = "Ingresá la contraseña.") String password) {

  public LoginRequest {
    username = Textos.limpiar(username);
  }

  // Nunca imprimir la contraseña, ni siquiera por accidente en un log.
  @Override
  public String toString() {
    return "LoginRequest[username=" + username + "]";
  }
}
