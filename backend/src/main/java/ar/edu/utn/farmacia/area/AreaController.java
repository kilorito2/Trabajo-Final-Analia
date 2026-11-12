package ar.edu.utn.farmacia.area;

import ar.edu.utn.farmacia.common.EstadoRequest;
import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
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
@RequestMapping("/api/areas")
@RequiredArgsConstructor
public class AreaController {

  private final AreaService areaService;

  @GetMapping
  @PreAuthorize("hasAuthority('LECTURA')")
  public Page<AreaResponse> listar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean activo,
      @PageableDefault(size = 20, sort = "nombre") Pageable pagina) {
    return areaService.listar(q, activo, pagina);
  }

  /** Áreas en Excel (XLSX), CSV o PDF, con los filtros del listado. */
  @GetMapping("/exportar")
  @PreAuthorize("hasAuthority('LECTURA')")
  public ResponseEntity<byte[]> exportar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean activo,
      @RequestParam(defaultValue = "CSV") FormatoReporte formato) {
    return Exportador.descarga(areaService.exportar(q, activo, formato), "areas", formato);
  }

  @PostMapping
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ResponseEntity<AreaResponse> crear(@Valid @RequestBody AreaRequest pedido) {
    AreaResponse creada = areaService.crear(pedido);
    return ResponseEntity.created(URI.create("/api/areas/" + creada.id())).body(creada);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public AreaResponse editar(@PathVariable Long id, @Valid @RequestBody AreaRequest pedido) {
    return areaService.editar(id, pedido);
  }

  @PatchMapping("/{id}/estado")
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ResponseEntity<Void> cambiarEstado(
      @PathVariable Long id, @Valid @RequestBody EstadoRequest pedido) {
    areaService.cambiarEstado(id, pedido.activo());
    return ResponseEntity.noContent().build();
  }
}
