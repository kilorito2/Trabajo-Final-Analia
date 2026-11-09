package ar.edu.utn.farmacia.alerta;

import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.transferencia.TransferenciaRepository;
import ar.edu.utn.farmacia.transferencia.TransferenciaService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResumenService {

  private static final int ULTIMAS_TRANSFERENCIAS = 5;
  private static final int DIAS_DE_EGRESOS = 30;

  private final AlertaService alertaService;
  private final TransferenciaService transferenciaService;
  private final TransferenciaRepository transferenciaRepository;
  private final MedicamentoRepository medicamentoRepository;
  private final Clock clock;

  @Transactional(readOnly = true)
  public ResumenResponse calcular() {
    AlertasResponse alertas = alertaService.calcular();
    LocalDate hoy = LocalDate.now(clock);
    OffsetDateTime inicioDeHoy = hoy.atStartOfDay(clock.getZone()).toOffsetDateTime();
    OffsetDateTime inicioDeManana =
        hoy.plusDays(1).atStartOfDay(clock.getZone()).toOffsetDateTime();
    OffsetDateTime inicioDeEgresos =
        hoy.minusDays(DIAS_DE_EGRESOS - 1L).atStartOfDay(clock.getZone()).toOffsetDateTime();

    return new ResumenResponse(
        new ResumenResponse.Totales(
            alertas.sinStock().size(),
            alertas.stockBajo().size(),
            alertas.vencidos().size(),
            alertas.porVencer().size()),
        alertas.diasPorVencer(),
        medicamentoRepository.countByActivoTrue(),
        transferenciaRepository.countByFechaHoraGreaterThanEqualAndFechaHoraLessThan(
            inicioDeHoy, inicioDeManana),
        transferenciaService.ultimas(ULTIMAS_TRANSFERENCIAS),
        transferenciaRepository.egresosPorArea(inicioDeEgresos));
  }
}
