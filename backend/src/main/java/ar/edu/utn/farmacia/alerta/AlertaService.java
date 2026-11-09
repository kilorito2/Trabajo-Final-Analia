package ar.edu.utn.farmacia.alerta;

import ar.edu.utn.farmacia.common.FarmaciaProperties;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.medicamento.EstadoStock;
import ar.edu.utn.farmacia.medicamento.MedicamentoConStock;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Las alertas se calculan en el momento, con "hoy" del Clock. No se guardan. */
@Service
@RequiredArgsConstructor
public class AlertaService {

  // El más crítico primero: menor stockTotal / stockMinimo. Se compara multiplicando en cruz para
  // no dividir (en STOCK_BAJO el mínimo siempre es mayor a 0).
  private static final Comparator<MedicamentoConStock> MAS_CRITICO_PRIMERO =
      (a, b) -> Long.compare(a.stockTotal() * b.stockMinimo(), b.stockTotal() * a.stockMinimo());

  private final MedicamentoRepository medicamentoRepository;
  private final LoteRepository loteRepository;
  private final FarmaciaProperties propiedades;
  private final Clock clock;

  @Transactional(readOnly = true)
  public AlertasResponse calcular() {
    LocalDate hoy = LocalDate.now(clock);
    int diasPorVencer = propiedades.alertas().diasPorVencer();
    LocalDate limite = hoy.plusDays(diasPorVencer);

    List<MedicamentoConStock> activos = medicamentoRepository.activosConStock(hoy);
    List<AlertaMedicamento> sinStock =
        activos.stream()
            .filter(medicamento -> medicamento.estado() == EstadoStock.SIN_STOCK)
            .sorted(Comparator.comparing(MedicamentoConStock::nombre))
            .map(AlertaMedicamento::desde)
            .toList();
    List<AlertaMedicamento> stockBajo =
        activos.stream()
            .filter(medicamento -> medicamento.estado() == EstadoStock.STOCK_BAJO)
            .sorted(MAS_CRITICO_PRIMERO.thenComparing(MedicamentoConStock::nombre))
            .map(AlertaMedicamento::desde)
            .toList();

    // Incluye lotes de medicamentos inactivos: la mercadería sigue en el depósito.
    List<Lote> lotes =
        loteRepository.conStockQueVencenHasta(limite).stream()
            .filter(lote -> lote.tieneStock() && !lote.getFechaVencimiento().isAfter(limite))
            .sorted(Comparator.comparing(Lote::getFechaVencimiento))
            .toList();
    List<AlertaLote> vencidos =
        lotes.stream()
            .filter(lote -> lote.estaVencido(hoy))
            .map(lote -> AlertaLote.desde(lote, hoy))
            .toList();
    List<AlertaLote> porVencer =
        lotes.stream()
            .filter(lote -> !lote.estaVencido(hoy))
            .map(lote -> AlertaLote.desde(lote, hoy))
            .toList();

    return new AlertasResponse(diasPorVencer, sinStock, stockBajo, vencidos, porVencer);
  }
}
