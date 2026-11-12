package ar.edu.utn.farmacia.alerta;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('LECTURA')")
public class AlertaController {

  private final AlertaService alertaService;
  private final ResumenService resumenService;

  @GetMapping("/api/alertas")
  public AlertasResponse alertas() {
    return alertaService.calcular();
  }

  /** Alertas actuales en Excel (XLSX), CSV o PDF, en el orden del panel. */
  @GetMapping("/api/alertas/exportar")
  public ResponseEntity<byte[]> exportar(
      @RequestParam(defaultValue = "CSV") FormatoReporte formato) {
    return Exportador.descarga(alertaService.exportar(formato), "alertas", formato);
  }

  @GetMapping("/api/resumen")
  public ResumenResponse resumen() {
    return resumenService.calcular();
  }
}
