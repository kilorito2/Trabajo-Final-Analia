package ar.edu.utn.farmacia.proveedor;

import ar.edu.utn.farmacia.common.EstadoRequest;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

  private final ProveedorService proveedorService;

  @GetMapping
  @PreAuthorize("hasAuthority('LECTURA')")
  public Page<ProveedorResponse> listar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean activo,
      @PageableDefault(size = 20, sort = "razonSocial") Pageable pagina) {
    return proveedorService.listar(q, activo, pagina);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('LECTURA')")
  public ProveedorResponse obtener(@PathVariable Long id) {
    return proveedorService.obtener(id);
  }

  @PostMapping
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ResponseEntity<ProveedorResponse> crear(@Valid @RequestBody ProveedorRequest pedido) {
    ProveedorResponse creado = proveedorService.crear(pedido);
    return ResponseEntity.created(URI.create("/api/proveedores/" + creado.id())).body(creado);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ProveedorResponse editar(
      @PathVariable Long id, @Valid @RequestBody ProveedorRequest pedido) {
    return proveedorService.editar(id, pedido);
  }

  @PatchMapping("/{id}/estado")
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ResponseEntity<Void> cambiarEstado(
      @PathVariable Long id, @Valid @RequestBody EstadoRequest pedido) {
    proveedorService.cambiarEstado(id, pedido.activo());
    return ResponseEntity.noContent().build();
  }
}
