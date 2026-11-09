package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.auth.UsuarioActual;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.common.RecursoNoEncontradoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("username", "nombreCompleto", "creadoEn");

  private final UsuarioRepository usuarioRepository;
  private final PasswordEncoder passwordEncoder;
  private final UsuarioActual usuarioActual;
  private final Clock clock;

  @Transactional(readOnly = true)
  public Page<UsuarioResponse> listar(String q, Boolean activo, Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    List<Specification<Usuario>> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      String patron = "%" + q.strip().toLowerCase(Locale.ROOT) + "%";
      filtros.add(
          (raiz, consulta, cb) ->
              cb.or(
                  cb.like(cb.lower(raiz.get("username")), patron),
                  cb.like(cb.lower(raiz.get("nombreCompleto")), patron)));
    }
    if (activo != null) {
      filtros.add((raiz, consulta, cb) -> cb.equal(raiz.get("activo"), activo));
    }
    return usuarioRepository
        .findAll(Specification.allOf(filtros), pagina)
        .map(UsuarioResponse::desde);
  }

  @Transactional
  public UsuarioResponse crear(UsuarioRequest pedido) {
    String username = Usuario.normalizarUsername(pedido.username());
    if (usuarioRepository.existsByUsername(username)) {
      throw new ReglaNegocioException(
          "USERNAME_DUPLICADO", "Ya existe un usuario con el nombre '" + username + "'.");
    }
    Usuario usuario =
        new Usuario(
            username,
            pedido.nombreCompleto(),
            passwordEncoder.encode(pedido.password()),
            pedido.rol(),
            OffsetDateTime.now(clock));
    return UsuarioResponse.desde(usuarioRepository.save(usuario));
  }

  @Transactional
  public UsuarioResponse editar(Long id, UsuarioEdicionRequest pedido) {
    Usuario usuario = buscar(id);
    if (usuario.esAdminActivo() && pedido.rol() != Rol.ADMIN) {
      verificarQueNoEsElUltimoAdmin();
    }
    usuario.setNombreCompleto(pedido.nombreCompleto());
    usuario.setRol(pedido.rol());
    return UsuarioResponse.desde(usuario);
  }

  @Transactional
  public void cambiarEstado(Long id, boolean activo) {
    Usuario usuario = buscar(id);
    if (!activo && usuario.getId().equals(usuarioActual.id())) {
      throw new ReglaNegocioException("PROPIO_USUARIO", "No podés desactivar tu propio usuario.");
    }
    if (!activo && usuario.esAdminActivo()) {
      verificarQueNoEsElUltimoAdmin();
    }
    usuario.setActivo(activo);
  }

  @Transactional
  public void restablecerPassword(Long id, RestablecerPasswordRequest pedido) {
    buscar(id).setPasswordHash(passwordEncoder.encode(pedido.passwordNueva()));
  }

  private void verificarQueNoEsElUltimoAdmin() {
    if (usuarioRepository.countByRolAndActivoTrue(Rol.ADMIN) <= 1) {
      throw new ReglaNegocioException(
          "ULTIMO_ADMIN", "No se puede dejar al sistema sin ningún ADMIN activo.");
    }
  }

  private Usuario buscar(Long id) {
    return usuarioRepository
        .findById(id)
        .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + id + "."));
  }
}
