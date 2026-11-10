package ar.edu.utn.farmacia.medicamento;

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
@RequestMapping("/api/medicamentos")
@RequiredArgsConstructor
public class MedicamentoController {

  private final MedicamentoService medicamentoService;

  @GetMapping
  @PreAuthorize("hasAuthority('LECTURA')")
  public Page<MedicamentoResponse> listar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) EstadoStock estado,
      @RequestParam(required = false) Boolean activo,
      @PageableDefault(size = 20, sort = "nombre") Pageable pagina) {
    return medicamentoService.listar(new FiltroMedicamentos(q, estado, activo), pagina);
  }

  /** Reporte de stock en CSV (para Excel) o PDF, con los filtros del listado. */
  @GetMapping("/exportar")
  @PreAuthorize("hasAuthority('LECTURA')")
  public ResponseEntity<byte[]> exportar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) EstadoStock estado,
      @RequestParam(required = false) Boolean activo,
      @RequestParam(defaultValue = "CSV") FormatoReporte formato) {
    byte[] contenido =
        medicamentoService.exportar(new FiltroMedicamentos(q, estado, activo), formato);
    return Exportador.descarga(contenido, "stock_medicamentos", formato);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('LECTURA')")
  public MedicamentoDetalleResponse obtener(@PathVariable Long id) {
    return medicamentoService.obtener(id);
  }

  @PostMapping
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ResponseEntity<MedicamentoResponse> crear(@Valid @RequestBody MedicamentoRequest pedido) {
    MedicamentoResponse creado = medicamentoService.crear(pedido);
    return ResponseEntity.created(URI.create("/api/medicamentos/" + creado.id())).body(creado);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public MedicamentoResponse editar(
      @PathVariable Long id, @Valid @RequestBody MedicamentoRequest pedido) {
    return medicamentoService.editar(id, pedido);
  }

  @PatchMapping("/{id}/estado")
  @PreAuthorize("hasAuthority('CATALOGO_EDITAR')")
  public ResponseEntity<Void> cambiarEstado(
      @PathVariable Long id, @Valid @RequestBody EstadoRequest pedido) {
    medicamentoService.cambiarEstado(id, pedido.activo());
    return ResponseEntity.noContent().build();
  }
}
