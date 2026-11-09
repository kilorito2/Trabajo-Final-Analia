package ar.edu.utn.farmacia.proveedor;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Los mismos vectores que usa el front. */
class CuitValidatorTest {

  private final CuitValidator validador = new CuitValidator();

  @ParameterizedTest
  @ValueSource(strings = {"20-12345678-6", "30-71234567-1", "27-33333333-9", "20123456786"})
  void aceptaCuitsValidos(String cuit) {
    assertThat(validador.isValid(cuit, null)).isTrue();
  }

  @ParameterizedTest
  @ValueSource(strings = {"20-12345678-5", "20-99999999-0", "2012345678", "20-1234567A-6", ""})
  void rechazaCuitsInvalidos(String cuit) {
    assertThat(validador.isValid(cuit, null)).isFalse();
  }

  @ParameterizedTest
  @ValueSource(strings = {"20-12345678-6", " 20 12345678 6 ", "20123456786"})
  void normalizaAOnceDigitos(String cuit) {
    assertThat(Cuits.normalizar(cuit)).isEqualTo("20123456786");
  }

  @ParameterizedTest
  @ValueSource(strings = {"20123456786"})
  void formateaConGuiones(String cuit) {
    assertThat(Cuits.formatear(cuit)).isEqualTo("20-12345678-6");
  }
}
