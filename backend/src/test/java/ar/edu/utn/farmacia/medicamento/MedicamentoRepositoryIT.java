package ar.edu.utn.farmacia.medicamento;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.utn.farmacia.IntegracionBase;
import ar.edu.utn.farmacia.RelojFijoConfig;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.proveedor.Proveedor;
import ar.edu.utn.farmacia.proveedor.ProveedorRepository;
import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

/** Corre dentro de una transacción que se deshace al final de cada test. */
@Transactional
class MedicamentoRepositoryIT extends IntegracionBase {

  private MedicamentoRepository medicamentoRepository;
  private LoteRepository loteRepository;
  private Proveedor proveedor;
  private Usuario admin;
  private String prefijo;

  @BeforeEach
  void preparar(
      @Autowired MedicamentoRepository medicamentoRepository,
      @Autowired LoteRepository loteRepository,
      @Autowired ProveedorRepository proveedorRepository,
      @Autowired UsuarioRepository usuarioRepository) {
    this.medicamentoRepository = medicamentoRepository;
    this.loteRepository = loteRepository;
    this.proveedor =
        proveedorRepository.saveAndFlush(
            new Proveedor("Proveedor repo " + sufijo(), cuitNuevo(), null, null));
    this.admin = usuarioRepository.findByUsername("admin").orElseThrow();
    this.prefijo = "REPO" + sufijo().replace("-", "");
  }

  @Test
  void elStockTotalExcluyeLosLotesVencidos() {
    Medicamento medicamento = medicamento("A", 5);
    lote(medicamento, HOY.minusDays(1), 50);
    lote(medicamento, HOY, 7);
    lote(medicamento, HOY.plusDays(40), 13);

    MedicamentoConStock fila = buscar(null, PageRequest.of(0, 10)).getContent().getFirst();

    assertThat(fila.stockTotal()).isEqualTo(20);
    assertThat(fila.proximoVencimiento()).isEqualTo(HOY);
    assertThat(fila.estado()).isEqualTo(EstadoStock.OK);
  }

  @Test
  void filtraPorEstadoDeStock() {
    Medicamento sinStock = medicamento("SIN", 10);
    lote(sinStock, HOY.minusDays(3), 100);
    Medicamento bajo = medicamento("BAJO", 10);
    lote(bajo, HOY.plusDays(10), 10);
    Medicamento ok = medicamento("OK", 10);
    lote(ok, HOY.plusDays(10), 11);

    assertThat(idsConEstado(EstadoStock.SIN_STOCK)).containsExactly(sinStock.getId());
    assertThat(idsConEstado(EstadoStock.STOCK_BAJO)).containsExactly(bajo.getId());
    assertThat(idsConEstado(EstadoStock.OK)).containsExactly(ok.getId());
  }

  @Test
  void ordenaPorStockTotalYPorProximoVencimiento() {
    Medicamento poco = medicamento("POCO", 0);
    lote(poco, HOY.plusDays(90), 5);
    Medicamento mucho = medicamento("MUCHO", 0);
    lote(mucho, HOY.plusDays(10), 500);
    Medicamento nada = medicamento("NADA", 0);

    assertThat(ids(Sort.by(Sort.Direction.DESC, "stockTotal")))
        .containsExactly(mucho.getId(), poco.getId(), nada.getId());
    // Sin lotes con stock, el próximo vencimiento es null y va al final.
    assertThat(ids(Sort.by(Sort.Direction.ASC, "proximoVencimiento")))
        .containsExactly(mucho.getId(), poco.getId(), nada.getId());
  }

  @Test
  void paginaConElTotalCorrecto() {
    for (int i = 0; i < 3; i++) {
      Medicamento medicamento = medicamento("P" + i, 0);
      lote(medicamento, HOY.plusDays(30), 10);
      lote(medicamento, HOY.plusDays(60), 10);
    }

    Page<MedicamentoConStock> pagina = buscar(null, PageRequest.of(0, 2, Sort.by("nombre")));

    assertThat(pagina.getContent()).hasSize(2);
    assertThat(pagina.getTotalElements()).isEqualTo(3);
    assertThat(pagina.getTotalPages()).isEqualTo(2);
  }

  private Page<MedicamentoConStock> buscar(EstadoStock estado, PageRequest pagina) {
    return medicamentoRepository.buscarConStock(
        new FiltroMedicamentos(prefijo, estado, null), HOY, pagina);
  }

  private List<Long> idsConEstado(EstadoStock estado) {
    return buscar(estado, PageRequest.of(0, 10)).map(MedicamentoConStock::id).getContent();
  }

  private List<Long> ids(Sort orden) {
    return buscar(null, PageRequest.of(0, 10, orden)).map(MedicamentoConStock::id).getContent();
  }

  private Medicamento medicamento(String codigo, int stockMinimo) {
    return medicamentoRepository.saveAndFlush(
        new Medicamento(prefijo + codigo, "Remedio " + codigo, "ampolla", stockMinimo));
  }

  private void lote(Medicamento medicamento, LocalDate vencimiento, int cantidad) {
    loteRepository.saveAndFlush(
        new Lote(
            medicamento,
            proveedor,
            "L" + sufijo(),
            vencimiento,
            cantidad,
            HOY.minusDays(100),
            admin,
            OffsetDateTime.now(RelojFijoConfig.reloj())));
  }
}
