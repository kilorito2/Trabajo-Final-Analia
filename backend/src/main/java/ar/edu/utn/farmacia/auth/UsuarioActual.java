package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * El usuario de cada operación sale del token ya validado (el "sub" es su id). Ningún pedido trae
 * un campo de usuario y ninguna cabecera lo puede reemplazar.
 */
@Component
@RequiredArgsConstructor
public class UsuarioActual {

  private final UsuarioRepository usuarioRepository;

  public Long id() {
    Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
    if (autenticacion == null || autenticacion.getName() == null) {
      throw new AuthenticationCredentialsNotFoundException("No hay un usuario autenticado.");
    }
    return Long.valueOf(autenticacion.getName());
  }

  public Usuario obtener() {
    return usuarioRepository
        .findById(id())
        .orElseThrow(
            () -> new AuthenticationCredentialsNotFoundException("El usuario ya no existe."));
  }
}
