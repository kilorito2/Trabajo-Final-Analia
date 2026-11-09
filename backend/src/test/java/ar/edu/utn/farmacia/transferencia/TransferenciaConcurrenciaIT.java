package ar.edu.utn.farmacia.transferencia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import ar.edu.utn.farmacia.IntegracionBase;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/** No es @Transactional: cada pedido tiene que confirmar su propia transacción. */
class TransferenciaConcurrenciaIT extends IntegracionBase {

  @Test
  void dosTransferenciasSimultaneasNoDejanStockNegativo() throws Exception {
    String token = tokenAdmin();
    Long areaId = crearArea(token);
    Long proveedorId = crearProveedor(token);
    Long medicamentoId = crearMedicamento(token, "CONC-" + sufijo(), 0);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(90), 100);

    Map<String, Object> pedido = transferencia(areaId, List.of(item(medicamentoId, 60)));
    List<Integer> estados = enParalelo(token, pedido, pedido);

    assertThat(estados).containsExactlyInAnyOrder(201, 409);
    consultar("/api/medicamentos/" + medicamentoId, token)
        .andExpect(jsonPath("$.stockTotal").value(40))
        .andExpect(jsonPath("$.lotes[0].cantidadActual").value(40));
  }

  @Test
  void pedidosEnOrdenInversoNoSeTraban() throws Exception {
    String token = tokenAdmin();
    Long areaId = crearArea(token);
    Long proveedorId = crearProveedor(token);
    Long primero = crearMedicamento(token, "CONC-A-" + sufijo(), 0);
    Long segundo = crearMedicamento(token, "CONC-B-" + sufijo(), 0);
    ingresarLote(token, primero, proveedorId, HOY.plusDays(90), 100);
    ingresarLote(token, segundo, proveedorId, HOY.plusDays(90), 100);

    List<Integer> estados =
        enParalelo(
            token,
            transferencia(areaId, List.of(item(primero, 60), item(segundo, 60))),
            transferencia(areaId, List.of(item(segundo, 60), item(primero, 60))));

    assertThat(estados).containsExactlyInAnyOrder(201, 409);
    consultar("/api/medicamentos/" + primero, token).andExpect(jsonPath("$.stockTotal").value(40));
    consultar("/api/medicamentos/" + segundo, token).andExpect(jsonPath("$.stockTotal").value(40));
  }

  private List<Integer> enParalelo(
      String token, Map<String, Object> pedidoA, Map<String, Object> pedidoB) throws Exception {
    CountDownLatch largada = new CountDownLatch(1);
    ExecutorService hilos = Executors.newFixedThreadPool(2);
    try {
      Future<Integer> a = hilos.submit(() -> transferir(largada, token, pedidoA));
      Future<Integer> b = hilos.submit(() -> transferir(largada, token, pedidoB));
      largada.countDown();
      // Si hubiera un deadlock, esto vencería en lugar de quedar colgado.
      return List.of(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
    } finally {
      hilos.shutdownNow();
    }
  }

  private int transferir(CountDownLatch largada, String token, Map<String, Object> pedido)
      throws Exception {
    largada.await();
    return enviar(post("/api/transferencias"), token, pedido).andReturn().getResponse().getStatus();
  }
}
