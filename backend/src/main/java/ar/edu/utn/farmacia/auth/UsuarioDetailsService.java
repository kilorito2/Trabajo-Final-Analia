package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Solo se usa en el login. El nombre del UserDetails es el id, que después va como "sub". */
@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {

  private final UsuarioRepository usuarioRepository;

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String username) {
    Usuario usuario =
        usuarioRepository
            .findByUsername(Usuario.normalizarUsername(username))
            .orElseThrow(() -> new UsernameNotFoundException("Usuario inexistente"));
    return User.withUsername(usuario.getId().toString())
        .password(usuario.getPasswordHash())
        .disabled(!usuario.isActivo())
        .authorities(PermisosDeUsuario.de(usuario.getRol()))
        .build();
  }
}
