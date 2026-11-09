package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.auth.Rol;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record UsuarioResponse(
    @NotNull Long id,
    @NotNull String username,
    @NotNull String nombreCompleto,
    @NotNull Rol rol,
    boolean activo,
    @NotNull OffsetDateTime creadoEn) {

  public static UsuarioResponse desde(Usuario usuario) {
    return new UsuarioResponse(
        usuario.getId(),
        usuario.getUsername(),
        usuario.getNombreCompleto(),
        usuario.getRol(),
        usuario.isActivo(),
        usuario.getCreadoEn());
  }
}
