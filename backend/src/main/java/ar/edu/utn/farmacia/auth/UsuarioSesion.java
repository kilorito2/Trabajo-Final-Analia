package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.usuario.Usuario;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public record UsuarioSesion(
    @NotNull Long id,
    @NotNull String username,
    @NotNull String nombreCompleto,
    @NotNull Rol rol,
    @NotNull Set<Permiso> permisos) {

  public static UsuarioSesion desde(Usuario usuario) {
    return new UsuarioSesion(
        usuario.getId(),
        usuario.getUsername(),
        usuario.getNombreCompleto(),
        usuario.getRol(),
        usuario.getRol().permisos());
  }
}
