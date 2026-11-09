package ar.edu.utn.farmacia.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class CsvTest {

  @ParameterizedTest
  @CsvSource(
      delimiter = '|',
      quoteCharacter = '"',
      value = {
        "=SUMA(A1)|'=SUMA(A1)",
        "+5491100000000|'+5491100000000",
        "-2+3|'-2+3",
        "@usuario|'@usuario",
        "Guardia|Guardia"
      })
  void neutralizaLasFormulas(String valor, String esperado) {
    assertThat(Csv.celda(valor)).isEqualTo(esperado);
  }

  @Test
  void neutralizaTabulacionYRetornoDeCarroAlPrincipio() {
    assertThat(Csv.celda("\tcmd")).isEqualTo("'\tcmd");
    assertThat(Csv.celda("\rcmd")).isEqualTo("\"'\rcmd\"");
  }

  @Test
  void escapaComillasYPuntoYComa() {
    assertThat(Csv.celda("Urgente; llevar \"ya\"")).isEqualTo("\"Urgente; llevar \"\"ya\"\"\"");
    assertThat(Csv.celda("dos\nrenglones")).isEqualTo("\"dos\nrenglones\"");
  }

  @Test
  void armaLaLineaConPuntoYComaYFinDeLineaDeWindows() {
    assertThat(Csv.linea(List.of("TR-000001", "=1+1", "", "texto")))
        .isEqualTo("TR-000001;'=1+1;;texto\r\n");
  }

  @Test
  void valoresVaciosONulosQuedanVacios() {
    assertThat(Csv.celda(null)).isEmpty();
    assertThat(Csv.celda("")).isEmpty();
  }
}
