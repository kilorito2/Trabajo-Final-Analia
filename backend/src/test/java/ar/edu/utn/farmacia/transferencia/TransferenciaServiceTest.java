package ar.edu.utn.farmacia.transferencia;

import static ar.edu.utn.farmacia.RelojFijoConfig.HOY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ar.edu.utn.farmacia.Entidades;
import ar.edu.utn.farmacia.RelojFijoConfig;
import ar.edu.utn.farmacia.area.Area;
import ar.edu.utn.farmacia.area.AreaRepository;
import ar.edu.utn.farmacia.auth.UsuarioActual;
import ar.edu.utn.farmacia.common.ErrorDeCampoException;
import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.lote.MovimientoStock;
import ar.edu.utn.farmacia.lote.MovimientoStockRepository;
import ar.edu.utn.farmacia.lote.TipoMovimiento;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class TransferenciaServiceTest {

  private static final Long USUARIO_ID = 7L;

  @Mock private TransferenciaRepository transferenciaRepository;
  @Mock private AreaRepository areaRepository;
  @Mock private MedicamentoRepository medicamentoRepository;
  @Mock private LoteRepository loteRepository;
  @Mock private MovimientoStockRepository movimientoRepository;
  @Mock private UsuarioRepository usuarioRepository;

  private TransferenciaService servicio;
  private final Area guardia = Entidades.area(1L, true);
  private final Medicamento amoxicilina = Entidades.medicamento(10L, 0, true);
  private final Medicamento ceftriaxona = Entidades.medicamento(20L, 0, true);

  @BeforeEach
  void preparar() {
    servicio =
        new TransferenciaService(
            transferenciaRepository,
            areaRepository,
            medicamentoRepository,
            loteRepository,
            movimientoRepository,
            new UsuarioActual(usuarioRepository),
            new Exportador(RelojFijoConfig.reloj()),
            RelojFijoConfig.reloj());
    SecurityContextHolder.getContext()
        .setAuthentication(new TestingAuthenticationToken(USUARIO_ID.toString(), null));
    lenient().when(areaRepository.findById(1L)).thenReturn(Optional.of(guardia));
    lenient()
        .when(medicamentoRepository.findAllById(anyIterable()))
        .thenReturn(List.of(amoxicilina, ceftriaxona));
    lenient()
        .when(usuarioRepository.findById(USUARIO_ID))
        .thenReturn(Optional.of(Entidades.usuario(USUARIO_ID)));
    lenient()
        .when(transferenciaRepository.save(any()))
        .thenAnswer(invocacion -> invocacion.getArgument(0));
  }

  @AfterEach
  void limpiar() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void descuentaPrimeroDelLoteQueVenceAntes() {
    Lote vence30 = Entidades.lote(3L, amoxicilina, HOY.plusDays(30), HOY.minusDays(5), 10);
    Lote vence10 = Entidades.lote(1L, amoxicilina, HOY.plusDays(10), HOY.minusDays(5), 10);
    Lote vence20 = Entidades.lote(2L, amoxicilina, HOY.plusDays(20), HOY.minusDays(5), 10);
    lotesDisponibles(vence30, vence10, vence20);

    TransferenciaResponse respuesta = servicio.transferir(pedido(item(10L, 15)));

    assertThat(respuesta.detalle())
        .extracting(TransferenciaResponse.Linea::loteId, TransferenciaResponse.Linea::cantidad)
        .containsExactly(tuple(1L, 10), tuple(2L, 5));
    assertThat(vence10.getCantidadActual()).isZero();
    assertThat(vence20.getCantidadActual()).isEqualTo(5);
    assertThat(vence30.getCantidadActual()).isEqualTo(10);

    List<MovimientoStock> movimientos = movimientosGuardados();
    assertThat(movimientos).hasSize(2);
    assertThat(movimientos).allMatch(movimiento -> movimiento.getTipo() == TipoMovimiento.EGRESO);
    assertThat(movimientos)
        .extracting(MovimientoStock::getCantidad, MovimientoStock::getSaldoResultante)
        .containsExactly(tuple(-10, 0), tuple(-5, 5));
  }

  @Test
  void conElMismoVencimientoDecideLaFechaDeIngresoYDespuesElId() {
    Lote ingresoTarde = Entidades.lote(1L, amoxicilina, HOY.plusDays(10), HOY.minusDays(1), 5);
    Lote ingresoTempranoIdAlto =
        Entidades.lote(5L, amoxicilina, HOY.plusDays(10), HOY.minusDays(9), 5);
    Lote ingresoTempranoIdBajo =
        Entidades.lote(4L, amoxicilina, HOY.plusDays(10), HOY.minusDays(9), 5);
    lotesDisponibles(ingresoTarde, ingresoTempranoIdAlto, ingresoTempranoIdBajo);

    TransferenciaResponse respuesta = servicio.transferir(pedido(item(10L, 12)));

    assertThat(respuesta.detalle())
        .extracting(TransferenciaResponse.Linea::loteId)
        .containsExactly(4L, 5L, 1L);
  }

  @Test
  void siUnItemNoAlcanzaNoSeModificaNada() {
    Lote amoxi = Entidades.lote(1L, amoxicilina, HOY.plusDays(10), HOY, 50);
    Lote ceftri = Entidades.lote(2L, ceftriaxona, HOY.plusDays(10), HOY, 12);
    lotesDisponibles(amoxi, ceftri);

    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, 5), item(20L, 20))))
        .isInstanceOf(StockInsuficienteException.class)
        .hasMessageContaining("disponible 12, solicitado 20")
        .satisfies(
            ex ->
                assertThat(((StockInsuficienteException) ex).getFaltantes())
                    .containsExactly(new Faltante(20L, ceftriaxona.descripcion(), 12, 20)));

    assertThat(amoxi.getCantidadActual()).isEqualTo(50);
    assertThat(ceftri.getCantidadActual()).isEqualTo(12);
    verify(transferenciaRepository, never()).save(any());
    verify(movimientoRepository, never()).saveAll(any());
  }

  @Test
  void informaTodosLosFaltantes() {
    lotesDisponibles(Entidades.lote(1L, amoxicilina, HOY.plusDays(10), HOY, 3));

    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, 5), item(20L, 1))))
        .isInstanceOf(StockInsuficienteException.class)
        .satisfies(
            ex ->
                assertThat(((StockInsuficienteException) ex).getFaltantes())
                    .extracting(Faltante::medicamentoId, Faltante::disponible, Faltante::solicitado)
                    .containsExactly(tuple(10L, 3L, 5), tuple(20L, 0L, 1)));
  }

  @Test
  void sumaLosItemsRepetidos() {
    lotesDisponibles(Entidades.lote(1L, amoxicilina, HOY.plusDays(10), HOY, 100));

    TransferenciaResponse respuesta = servicio.transferir(pedido(item(10L, 10), item(10L, 5)));

    assertThat(respuesta.detalle()).hasSize(1);
    assertThat(respuesta.detalle().getFirst().cantidad()).isEqualTo(15);
  }

  @Test
  void rechazaCantidadesCeroONegativas() {
    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, 0))))
        .isInstanceOf(ErrorDeCampoException.class);
    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, -3))))
        .isInstanceOf(ErrorDeCampoException.class);
    verify(loteRepository, never()).bloquearDisponibles(anyCollection(), any());
  }

  @Test
  void ignoraUnLoteVencidoAyerPeroUsaUnoQueVenceHoy() {
    Lote vencidoAyer = Entidades.lote(1L, amoxicilina, HOY.minusDays(1), HOY.minusDays(90), 100);
    Lote venceHoy = Entidades.lote(2L, amoxicilina, HOY, HOY.minusDays(30), 10);
    lotesDisponibles(vencidoAyer, venceHoy);

    TransferenciaResponse respuesta = servicio.transferir(pedido(item(10L, 10)));

    assertThat(respuesta.detalle())
        .extracting(TransferenciaResponse.Linea::loteId)
        .containsExactly(2L);
    assertThat(vencidoAyer.getCantidadActual()).isEqualTo(100);

    venceHoy.ajustar(10);
    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, 11))))
        .isInstanceOf(StockInsuficienteException.class)
        .hasMessageContaining("disponible 10, solicitado 11");
  }

  @Test
  void rechazaUnAreaInactiva() {
    when(areaRepository.findById(1L)).thenReturn(Optional.of(Entidades.area(1L, false)));

    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, 1))))
        .isInstanceOf(ReglaNegocioException.class)
        .extracting("codigo")
        .isEqualTo("AREA_INACTIVA");
  }

  @Test
  void rechazaUnMedicamentoInactivo() {
    amoxicilina.setActivo(false);

    assertThatThrownBy(() -> servicio.transferir(pedido(item(10L, 1))))
        .isInstanceOf(ReglaNegocioException.class)
        .extracting("codigo")
        .isEqualTo("MEDICAMENTO_INACTIVO");
  }

  @Test
  void elUsuarioSaleDelContextoDeSeguridad() {
    lotesDisponibles(Entidades.lote(1L, amoxicilina, HOY.plusDays(10), HOY, 10));

    TransferenciaResponse respuesta = servicio.transferir(pedido(item(10L, 1)));

    assertThat(respuesta.realizadaPor().id()).isEqualTo(USUARIO_ID);
    verify(usuarioRepository).findById(USUARIO_ID);
  }

  private void lotesDisponibles(Lote... lotes) {
    when(loteRepository.bloquearDisponibles(anyCollection(), eq(HOY)))
        .thenReturn(new ArrayList<>(Arrays.asList(lotes)));
  }

  @SuppressWarnings("unchecked")
  private List<MovimientoStock> movimientosGuardados() {
    ArgumentCaptor<List<MovimientoStock>> captor = ArgumentCaptor.forClass(List.class);
    verify(movimientoRepository).saveAll(captor.capture());
    return captor.getValue();
  }

  private static TransferenciaRequest pedido(TransferenciaRequest.Item... items) {
    return new TransferenciaRequest(1L, null, List.of(items));
  }

  private static TransferenciaRequest.Item item(Long medicamentoId, int cantidad) {
    return new TransferenciaRequest.Item(medicamentoId, cantidad);
  }
}
