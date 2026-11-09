package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.common.EstadoRequest;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasAuthority('USUARIO_GESTIONAR')")
@RequiredArgsConstructor
public class UsuarioController {

  private final UsuarioService usuarioService;

  @GetMapping
  public Page<UsuarioResponse> listar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean activo,
      @PageableDefault(size = 20, sort = "username", direction = Sort.Direction.ASC)
          Pageable pagina) {
    return usuarioService.listar(q, activo, pagina);
  }

  @PostMapping
  public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest pedido) {
    UsuarioResponse creado = usuarioService.crear(pedido);
    return ResponseEntity.created(URI.create("/api/usuarios/" + creado.id())).body(creado);
  }

  @PutMapping("/{id}")
  public UsuarioResponse editar(
      @PathVariable Long id, @Valid @RequestBody UsuarioEdicionRequest pedido) {
    return usuarioService.editar(id, pedido);
  }

  @PatchMapping("/{id}/estado")
  public ResponseEntity<Void> cambiarEstado(
      @PathVariable Long id, @Valid @RequestBody EstadoRequest pedido) {
    usuarioService.cambiarEstado(id, pedido.activo());
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/password")
  public ResponseEntity<Void> restablecerPassword(
      @PathVariable Long id, @Valid @RequestBody RestablecerPasswordRequest pedido) {
    usuarioService.restablecerPassword(id, pedido);
    return ResponseEntity.noContent().build();
  }
}
