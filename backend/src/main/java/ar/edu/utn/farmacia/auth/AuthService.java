package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.common.ErrorDeCampoException;
import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final TokenService tokenService;
  private final UsuarioActual usuarioActual;
  private final UsuarioRepository usuarioRepository;
  private final PasswordEncoder passwordEncoder;

  // Contraseña incorrecta, usuario inexistente o inactivo: la misma respuesta en los tres casos.
  public LoginResponse login(LoginRequest pedido) {
    Authentication autenticacion;
    try {
      autenticacion =
          authenticationManager.authenticate(
              UsernamePasswordAuthenticationToken.unauthenticated(
                  pedido.username(), pedido.password()));
    } catch (AuthenticationException ex) {
      throw new CredencialesInvalidasException();
    }
    Long usuarioId = Long.valueOf(autenticacion.getName());
    TokenService.TokenEmitido token = tokenService.emitir(usuarioId);
    Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow();
    return new LoginResponse(token.token(), token.expiraEn(), UsuarioSesion.desde(usuario));
  }

  @Transactional(readOnly = true)
  public UsuarioSesion sesionActual() {
    return UsuarioSesion.desde(usuarioActual.obtener());
  }

  @Transactional
  public void cambiarPassword(CambioPasswordRequest pedido) {
    Usuario usuario = usuarioActual.obtener();
    if (!passwordEncoder.matches(pedido.passwordActual(), usuario.getPasswordHash())) {
      throw new ErrorDeCampoException("passwordActual", "La contraseña actual no es correcta.");
    }
    usuario.setPasswordHash(passwordEncoder.encode(pedido.passwordNueva()));
  }
}
