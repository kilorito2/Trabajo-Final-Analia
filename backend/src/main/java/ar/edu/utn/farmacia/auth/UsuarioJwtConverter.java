package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Los permisos se leen de la base en cada pedido: una baja o un cambio de rol tienen efecto
 * inmediato, sin esperar a que venza el token.
 */
@Component
@RequiredArgsConstructor
public class UsuarioJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

  private final UsuarioRepository usuarioRepository;

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    Usuario usuario =
        idDelToken(jwt)
            .flatMap(usuarioRepository::findById)
            .filter(Usuario::isActivo)
            .orElseThrow(() -> new DisabledException("El usuario del token no está activo."));
    return new JwtAuthenticationToken(
        jwt, PermisosDeUsuario.de(usuario.getRol()), usuario.getId().toString());
  }

  private static Optional<Long> idDelToken(Jwt jwt) {
    try {
      return Optional.of(Long.valueOf(jwt.getSubject()));
    } catch (NumberFormatException ex) {
      return Optional.empty();
    }
  }
}
