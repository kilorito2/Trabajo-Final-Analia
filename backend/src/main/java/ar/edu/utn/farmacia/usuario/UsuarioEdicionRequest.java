package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioEdicionRequest(
    @NotBlank(message = "Ingresá el nombre completo.")
        @Size(max = 100, message = "El nombre completo admite hasta 100 caracteres.")
        String nombreCompleto,
    @NotNull(message = "Elegí un rol.") Rol rol) {

  public UsuarioEdicionRequest {
    nombreCompleto = Textos.limpiar(nombreCompleto);
  }
}
