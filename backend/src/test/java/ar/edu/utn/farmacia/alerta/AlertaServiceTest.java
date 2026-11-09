package ar.edu.utn.farmacia.alerta;

import static ar.edu.utn.farmacia.RelojFijoConfig.HOY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import ar.edu.utn.farmacia.Entidades;
import ar.edu.utn.farmacia.RelojFijoConfig;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.medicamento.MedicamentoConStock;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AlertaServiceTest {

  private static final int N = Entidades.DIAS_POR_VENCER;

  @Mock private MedicamentoRepository medicamentoRepository;
  @Mock private LoteRepository loteRepository;

  private AlertaService servicio;
  private final Medicamento activo = Entidades.medicamento(1L, 10, true);
  private final Medicamento inactivo = Entidades.medicamento(2L, 10, false);

  @BeforeEach
  void preparar() {
    servicio =
        new AlertaService(
            medicamentoRepository,
            loteRepository,
            Entidades.propiedades(),
            RelojFijoConfig.reloj());
  }

  @Test
  void clasificaLosBordesDeVencimiento() {
    Lote venceHoy = lote(1L, activo, 0);
    Lote venceEnN = lote(2L, activo, N);
    Lote venceEnNMasUno = lote(3L, activo, N + 1);
    Lote vencioAyer = lote(4L, activo, -1);
    sinMedicamentos();
    when(loteRepository.conStockQueVencenHasta(HOY.plusDays(N)))
        .thenReturn(List.of(vencioAyer, venceHoy, venceEnN, venceEnNMasUno));

    AlertasResponse alertas = servicio.calcular();

    assertThat(alertas.diasPorVencer()).isEqualTo(N);
    assertThat(alertas.porVencer()).extracting(AlertaLote::loteId).containsExactly(1L, 2L);
    assertThat(alertas.vencidos()).extracting(AlertaLote::loteId).containsExactly(4L);
    assertThat(alertas.vencidos().getFirst().diasParaVencer()).isEqualTo(-1);
    assertThat(alertas.porVencer().getFirst().diasParaVencer()).isZero();
  }

  @Test
  void unLoteVencidoDeUnMedicamentoInactivoIgualEsAlerta() {
    sinMedicamentos();
    when(loteRepository.conStockQueVencenHasta(any())).thenReturn(List.of(lote(5L, inactivo, -10)));

    assertThat(servicio.calcular().vencidos()).extracting(AlertaLote::loteId).containsExactly(5L);
  }

  @Test
  void losLotesEnCeroNoGeneranAlertasDeVencimiento() {
    Lote agotadoVencido = lote(6L, activo, -3);
    agotadoVencido.darDeBaja();
    Lote agotadoPorVencer = lote(7L, activo, 5);
    agotadoPorVencer.descontar(agotadoPorVencer.getCantidadActual());
    sinMedicamentos();
    when(loteRepository.conStockQueVencenHasta(any()))
        .thenReturn(List.of(agotadoVencido, agotadoPorVencer));

    AlertasResponse alertas = servicio.calcular();

    assertThat(alertas.vencidos()).isEmpty();
    assertThat(alertas.porVencer()).isEmpty();
  }

  @Test
  void clasificaElStockDeLosMedicamentos() {
    when(medicamentoRepository.activosConStock(HOY))
        .thenReturn(
            List.of(
                conStock(1L, "Amoxicilina", 0, 10),
                conStock(2L, "Atropina", 0, 0),
                conStock(3L, "Ceftriaxona", 10, 10),
                conStock(4L, "Dipirona", 2, 10),
                conStock(5L, "Enoxaparina", 11, 10)));
    when(loteRepository.conStockQueVencenHasta(any())).thenReturn(List.of());

    AlertasResponse alertas = servicio.calcular();

    // Stock mínimo 0 con stock 0 también es SIN_STOCK.
    assertThat(alertas.sinStock())
        .extracting(AlertaMedicamento::medicamentoId)
        .containsExactly(1L, 2L);
    // Stock igual al mínimo es STOCK_BAJO; el más crítico (2/10) va primero.
    assertThat(alertas.stockBajo())
        .extracting(AlertaMedicamento::medicamentoId)
        .containsExactly(4L, 3L);
  }

  private void sinMedicamentos() {
    when(medicamentoRepository.activosConStock(HOY)).thenReturn(List.of());
  }

  private static Lote lote(Long id, Medicamento medicamento, int diasParaVencer) {
    return Entidades.lote(id, medicamento, HOY.plusDays(diasParaVencer), HOY.minusDays(200), 20);
  }

  private static MedicamentoConStock conStock(Long id, String nombre, long stock, int minimo) {
    return new MedicamentoConStock(id, "C" + id, nombre, "ampolla", minimo, true, stock, null);
  }
}
