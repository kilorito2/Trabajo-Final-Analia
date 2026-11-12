package ar.edu.utn.farmacia.lote;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;

class LoteBusquedaIT extends IntegracionBase {

  @Test
  void buscaPorMedicamentoLoteYProveedorSinDistinguirMayusculas() throws Exception {
    String token = tokenAdmin();
    Long proveedorId = crearProveedor(token);
    String codigo = "BUS-" + sufijo();
    Long medicamentoId = crearMedicamento(token, codigo, 0);
    Long cercano = ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(10), 5);
    Long lejano = ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(90), 8);
    String numeroLejano = numeroDeLote(token, medicamentoId, lejano);
    String proveedor =
        JsonPath.read(
            cuerpo(consultar("/api/proveedores/" + proveedorId, token).andReturn()),
            "$.razonSocial");

    assertThat(ids(token, codigo.toLowerCase())).containsExactly(cercano, lejano);
    assertThat(ids(token, numeroLejano)).containsExactly(lejano);
    assertThat(ids(token, proveedor.toUpperCase())).containsExactly(cercano, lejano);
    assertThat(ids(token, codigo + "-no-existe")).isEmpty();
  }

  @Test
  void elReporteRespetaLaBusquedaYLaMuestraEnLosFiltros() throws Exception {
    String token = tokenAdmin();
    Long proveedorId = crearProveedor(token);
    String codigo = "REP-" + sufijo();
    Long medicamentoId = crearMedicamento(token, codigo, 0);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(10), 5);

    String csv =
        new String(
            mockMvc
                .perform(
                    conToken(
                        get("/api/lotes/exportar").param("formato", "CSV").param("q", codigo),
                        token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray(),
            StandardCharsets.UTF_8);

    // Encabezado más una fila: solo el lote del medicamento buscado.
    assertThat(csv.strip().split("\r\n")).hasSize(2);
    assertThat(csv).contains(codigo);
  }

  private List<Long> ids(String token, String q) throws Exception {
    String respuesta =
        cuerpo(
            mockMvc
                .perform(
                    conToken(
                        get("/api/lotes").param("sort", "fechaVencimiento,asc").param("q", q),
                        token))
                .andExpect(status().isOk())
                .andReturn());
    List<Number> numeros = JsonPath.read(respuesta, "$.content[*].id");
    return numeros.stream().map(Number::longValue).toList();
  }

  /** No hay GET de un lote por id: se toma del listado filtrado por su medicamento. */
  private String numeroDeLote(String token, Long medicamentoId, Long loteId) throws Exception {
    String lotes =
        cuerpo(consultar("/api/lotes?medicamentoId=" + medicamentoId, token).andReturn());
    List<String> numeros = JsonPath.read(lotes, "$.content[?(@.id == " + loteId + ")].numeroLote");
    return numeros.getFirst();
  }
}
