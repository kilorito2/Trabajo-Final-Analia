package ar.edu.utn.farmacia.lote;

import static ar.edu.utn.farmacia.RelojFijoConfig.HOY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ar.edu.utn.farmacia.Entidades;
import org.junit.jupiter.api.Test;

class LoteTest {

  private final Lote lote =
      Entidades.lote(1L, Entidades.medicamento(1L, 0, true), HOY.plusDays(60), HOY, 10);

  @Test
  void descontarMasDeLoDisponibleLanzaExcepcionYNoCambiaNada() {
    assertThatThrownBy(() -> lote.descontar(11)).isInstanceOf(IllegalStateException.class);
    assertThat(lote.getCantidadActual()).isEqualTo(10);
  }

  @Test
  void descontarUnaCantidadNegativaOCeroLanzaExcepcion() {
    assertThatThrownBy(() -> lote.descontar(0)).isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> lote.descontar(-5)).isInstanceOf(IllegalArgumentException.class);
    assertThat(lote.getCantidadActual()).isEqualTo(10);
  }

  @Test
  void descontarHastaCero() {
    lote.descontar(10);
    assertThat(lote.getCantidadActual()).isZero();
    assertThat(lote.estado(HOY, 30)).isEqualTo(EstadoLote.AGOTADO);
  }

  @Test
  void ajusteFueraDeRangoLanzaExcepcion() {
    assertThatThrownBy(() -> lote.ajustar(11)).isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> lote.ajustar(-1)).isInstanceOf(IllegalArgumentException.class);
    assertThat(lote.getCantidadActual()).isEqualTo(10);
  }

  @Test
  void ajusteDevuelveLaDiferenciaConSigno() {
    lote.descontar(4);
    assertThat(lote.ajustar(8)).isEqualTo(2);
    assertThat(lote.ajustar(3)).isEqualTo(-5);
  }

  @Test
  void unLoteNuevoNoPuedeTenerCantidadCeroONegativa() {
    assertThatThrownBy(() -> Entidades.lote(2L, Entidades.medicamento(1L, 0, true), HOY, HOY, 0))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void elDiaDelVencimientoTodaviaNoEstaVencido() {
    Lote venceHoy = Entidades.lote(3L, Entidades.medicamento(1L, 0, true), HOY, HOY, 5);
    assertThat(venceHoy.estaVencido(HOY)).isFalse();
    assertThat(venceHoy.estaVencido(HOY.plusDays(1))).isTrue();
    assertThat(venceHoy.estado(HOY, 30)).isEqualTo(EstadoLote.POR_VENCER);
  }
}
