package ar.edu.utn.farmacia.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RecuperacionPasswordTest {

  private static final OffsetDateTime AHORA =
      OffsetDateTime.of(2026, 3, 10, 12, 0, 0, 0, ZoneOffset.UTC);

  private final RecuperacionPassword recuperacion =
      new RecuperacionPassword(null, "hash", AHORA, AHORA.plusMinutes(15));

  @Test
  void estaVigenteHastaQueVence() {
    assertThat(recuperacion.estaVigente(AHORA.plusMinutes(14))).isTrue();
    assertThat(recuperacion.estaVigente(AHORA.plusMinutes(15))).isFalse();
  }

  @Test
  void alPasarseDeLosIntentosSeCierra() {
    for (int intento = 0; intento < 3; intento++) {
      assertThat(recuperacion.registrarIntento(3, AHORA)).isTrue();
    }
    assertThat(recuperacion.registrarIntento(3, AHORA)).isFalse();
    assertThat(recuperacion.estaVigente(AHORA)).isFalse();
  }

  @Test
  void cerrarDosVecesConservaLaPrimeraFecha() {
    recuperacion.cerrar(AHORA);
    recuperacion.cerrar(AHORA.plusMinutes(5));
    assertThat(recuperacion.getCerradaEn()).isEqualTo(AHORA);
  }

  @Test
  void noSePuedeCrearConVencimientoAnteriorALaCreacion() {
    assertThatThrownBy(() -> new RecuperacionPassword(null, "hash", AHORA, AHORA))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
