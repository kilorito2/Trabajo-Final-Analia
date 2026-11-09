package ar.edu.utn.farmacia.transferencia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

class FlujoCompletoIT extends IntegracionBase {

  @Test
  void ingresarTransferirYConsultarElResultado() throws Exception {
    String token = tokenAdmin();
    Long areaId = crearArea(token);
    Long proveedorId = crearProveedor(token);
    Long medicamentoId = crearMedicamento(token, "FLUJO-" + sufijo(), 5);
    Long loteLejano = ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(60), 30);
    Long loteCercano = ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(20), 10);

    MvcResult transferencia =
        enviar(
                post("/api/transferencias"),
                token,
                transferencia(areaId, List.of(item(medicamentoId, 25))))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.numero").value(startsWith("TR-")))
            .andExpect(jsonPath("$.detalle.length()").value(2))
            .andExpect(jsonPath("$.detalle[0].loteId").value(loteCercano.intValue()))
            .andExpect(jsonPath("$.detalle[0].cantidad").value(10))
            .andExpect(jsonPath("$.detalle[1].loteId").value(loteLejano.intValue()))
            .andExpect(jsonPath("$.detalle[1].cantidad").value(15))
            .andReturn();
    Long transferenciaId = id(transferencia, "$.id");

    consultar("/api/medicamentos/" + medicamentoId, token)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.stockTotal").value(15))
        .andExpect(jsonPath("$.lotes.length()").value(1))
        .andExpect(jsonPath("$.lotes[0].id").value(loteLejano.intValue()));

    consultar("/api/transferencias/" + transferenciaId, token)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.area.id").value(areaId.intValue()))
        .andExpect(jsonPath("$.detalle.length()").value(2));

    assertThat(sumaDeMovimientos(token, medicamentoId, loteLejano)).isEqualTo(15);
    assertThat(sumaDeMovimientos(token, medicamentoId, loteCercano)).isZero();
    consultar("/api/movimientos?loteId=" + loteCercano + "&tipo=EGRESO", token)
        .andExpect(jsonPath("$.content[0].transferenciaId").value(transferenciaId.intValue()))
        .andExpect(jsonPath("$.content[0].saldoResultante").value(0));

    MvcResult exportacion =
        consultar(
                "/api/transferencias/exportar?desde=" + HOY + "&hasta=" + HOY + "&areaId=" + areaId,
                token)
            .andExpect(status().isOk())
            .andExpect(
                header()
                    .string(
                        "Content-Disposition",
                        "attachment; filename=\"transferencias_" + HOY + "_" + HOY + ".csv\""))
            .andReturn();
    byte[] csv = exportacion.getResponse().getContentAsByteArray();
    assertThat(csv).startsWith((byte) 0xEF, (byte) 0xBB, (byte) 0xBF);
    String[] lineas = new String(csv, StandardCharsets.UTF_8).substring(1).split("\r\n");
    assertThat(lineas).hasSize(3);
    assertThat(lineas[0]).startsWith("Número;Fecha y hora;Área;Realizada por;Código;");
    assertThat(lineas[1]).startsWith(Transferencia.numero(transferenciaId) + ";");
  }

  /** La suma de los movimientos de un lote tiene que ser igual a su cantidadActual. */
  private long sumaDeMovimientos(String token, Long medicamentoId, Long loteId) throws Exception {
    MvcResult movimientos =
        consultar("/api/movimientos?size=100&loteId=" + loteId, token)
            .andExpect(status().isOk())
            .andReturn();
    List<Integer> cantidades = JsonPath.read(cuerpo(movimientos), "$.content[*].cantidad");
    long suma = cantidades.stream().mapToLong(Integer::longValue).sum();

    MvcResult lotes =
        consultar("/api/lotes?size=100&medicamentoId=" + medicamentoId, token).andReturn();
    List<Integer> actual =
        JsonPath.read(cuerpo(lotes), "$.content[?(@.id == " + loteId + ")].cantidadActual");
    assertThat(actual).containsExactly((int) suma);
    return suma;
  }
}
