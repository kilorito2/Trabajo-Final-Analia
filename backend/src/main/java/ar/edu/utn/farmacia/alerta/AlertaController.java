package ar.edu.utn.farmacia.alerta;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
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

  @GetMapping("/api/resumen")
  public ResumenResponse resumen() {
    return resumenService.calcular();
  }
}
