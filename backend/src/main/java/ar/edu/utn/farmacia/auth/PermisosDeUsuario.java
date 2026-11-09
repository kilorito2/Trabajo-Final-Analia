package ar.edu.utn.farmacia.auth;

import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

final class PermisosDeUsuario {

  private PermisosDeUsuario() {}

  static List<GrantedAuthority> de(Rol rol) {
    return rol.permisos().stream()
        .map(permiso -> (GrantedAuthority) new SimpleGrantedAuthority(permiso.name()))
        .toList();
  }
}
