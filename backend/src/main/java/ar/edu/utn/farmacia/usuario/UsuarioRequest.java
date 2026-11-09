package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
    @NotBlank(message = "Ingresá el usuario.")
        @Size(min = 3, max = 50, message = "El usuario debe tener entre 3 y 50 caracteres.")
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "El usuario solo puede tener letras, números, punto, guion y guion bajo.")
        String username,
    @NotBlank(message = "Ingresá el nombre completo.")
        @Size(max = 100, message = "El nombre completo admite hasta 100 caracteres.")
        String nombreCompleto,
    @NotNull(message = "Elegí un rol.") Rol rol,
    @NotBlank(message = "Ingresá la contraseña.")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
        String password) {

  public UsuarioRequest {
    username = Textos.limpiar(username);
    nombreCompleto = Textos.limpiar(nombreCompleto);
  }

  @Override
  public String toString() {
    return "UsuarioRequest[username=" + username + ", rol=" + rol + "]";
  }
}
