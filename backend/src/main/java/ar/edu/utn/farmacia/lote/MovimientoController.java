package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

  private final MovimientoService movimientoService;

  @GetMapping
  @PreAuthorize("hasAuthority('LECTURA')")
  public Page<MovimientoResponse> listar(
      @RequestParam(required = false) Long loteId,
      @RequestParam(required = false) Long medicamentoId,
      @RequestParam(required = false) TipoMovimiento tipo,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate desde,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate hasta,
      @PageableDefault(size = 20, sort = "fechaHora", direction = Sort.Direction.DESC)
          Pageable pagina) {
    return movimientoService.listar(loteId, medicamentoId, tipo, desde, hasta, pagina);
  }

  /** Movimientos de stock en Excel (XLSX), CSV o PDF, con los filtros del listado. */
  @GetMapping("/exportar")
  @PreAuthorize("hasAuthority('LECTURA')")
  public ResponseEntity<byte[]> exportar(
      @RequestParam(required = false) Long loteId,
      @RequestParam(required = false) Long medicamentoId,
      @RequestParam(required = false) TipoMovimiento tipo,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate desde,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate hasta,
      @RequestParam(defaultValue = "CSV") FormatoReporte formato) {
    byte[] contenido =
        movimientoService.exportar(loteId, medicamentoId, tipo, desde, hasta, formato);
    return Exportador.descarga(contenido, "movimientos_stock", formato);
  }
}
