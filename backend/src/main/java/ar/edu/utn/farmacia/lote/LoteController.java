package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class LoteController {

  private final LoteService loteService;

  @PostMapping("/api/medicamentos/{medicamentoId}/lotes")
  @PreAuthorize("hasAuthority('STOCK_INGRESAR')")
  public ResponseEntity<IngresoResponse> ingresar(
      @PathVariable Long medicamentoId, @Valid @RequestBody IngresoRequest pedido) {
    IngresoResponse ingreso = loteService.ingresar(medicamentoId, pedido);
    return ResponseEntity.created(URI.create("/api/medicamentos/" + medicamentoId)).body(ingreso);
  }

  @GetMapping("/api/lotes")
  @PreAuthorize("hasAuthority('LECTURA')")
  public Page<LoteResponse> listar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Long medicamentoId,
      @RequestParam(required = false) Set<EstadoLote> estado,
      @PageableDefault(size = 20, sort = "fechaVencimiento") Pageable pagina) {
    return loteService.listar(q, medicamentoId, estado, pagina);
  }

  /** Reporte de lotes y vencimientos en Excel (XLSX), CSV o PDF. */
  @GetMapping("/api/lotes/exportar")
  @PreAuthorize("hasAuthority('LECTURA')")
  public ResponseEntity<byte[]> exportar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Long medicamentoId,
      @RequestParam(required = false) Set<EstadoLote> estado,
      @RequestParam(defaultValue = "CSV") FormatoReporte formato) {
    byte[] contenido = loteService.exportar(q, medicamentoId, estado, formato);
    return Exportador.descarga(contenido, "lotes_vencimientos", formato);
  }

  @PostMapping("/api/lotes/{id}/baja")
  @PreAuthorize("hasAuthority('STOCK_BAJA_AJUSTE')")
  public LoteResponse darDeBaja(@PathVariable Long id, @Valid @RequestBody BajaRequest pedido) {
    return loteService.darDeBaja(id, pedido);
  }

  @PostMapping("/api/lotes/{id}/ajuste")
  @PreAuthorize("hasAuthority('STOCK_BAJA_AJUSTE')")
  public LoteResponse ajustar(@PathVariable Long id, @Valid @RequestBody AjusteRequest pedido) {
    return loteService.ajustar(id, pedido);
  }
}
