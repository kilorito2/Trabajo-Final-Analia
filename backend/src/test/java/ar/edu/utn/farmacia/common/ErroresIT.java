package ar.edu.utn.farmacia.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class ErroresIT extends IntegracionBase {

  @Test
  void validacionDevuelve400ConLosCamposConError() throws Exception {
    enviar(post("/api/areas"), tokenAdmin(), Map.of("nombre", "  "))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.title").value("Datos inválidos"))
        .andExpect(jsonPath("$.errors.nombre").exists());
  }

  @Test
  void jsonMalFormadoDevuelve400SinDetallesInternos() throws Exception {
    MvcResult resultado =
        mockMvc
            .perform(
                conToken(post("/api/areas"), tokenAdmin())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombre\": "))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.codigo").value("CUERPO_INVALIDO"))
            .andReturn();
    assertThat(cuerpo(resultado)).doesNotContain("jackson").doesNotContain("Exception");
  }

  @Test
  void ordenNoPermitidoDevuelve400() throws Exception {
    consultar("/api/usuarios?sort=passwordHash,asc", tokenAdmin())
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("ORDEN_INVALIDO"));
  }

  @Test
  void recursoInexistenteDevuelve404() throws Exception {
    consultar("/api/medicamentos/999999", tokenAdmin())
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.codigo").value("NO_ENCONTRADO"))
        .andExpect(jsonPath("$.detail").value("No existe el medicamento 999999."));
  }

  @Test
  void duplicadoDevuelve409ConCodigo() throws Exception {
    String token = tokenAdmin();
    String nombre = "Sala repetida " + sufijo();
    enviar(post("/api/areas"), token, Map.of("nombre", nombre)).andExpect(status().isCreated());

    enviar(post("/api/areas"), token, Map.of("nombre", nombre.toUpperCase()))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("NOMBRE_DUPLICADO"));
  }

  @Test
  void errorInesperadoDevuelve500ConErrorIdYSinStacktrace() throws Exception {
    MvcResult resultado =
        consultar("/api/prueba/error", tokenAdmin())
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.codigo").value("ERROR_INTERNO"))
            .andExpect(jsonPath("$.detail").value("Ocurrió un error inesperado."))
            .andExpect(jsonPath("$.errorId").isNotEmpty())
            .andReturn();
    assertThat(cuerpo(resultado))
        .doesNotContain("IllegalStateException")
        .doesNotContain("detalle interno")
        .doesNotContain("at ar.edu");
  }
}
