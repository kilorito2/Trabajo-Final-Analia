package ar.edu.utn.farmacia.lote;

import static ar.edu.utn.farmacia.RelojFijoConfig.HOY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ar.edu.utn.farmacia.Entidades;
import ar.edu.utn.farmacia.RelojFijoConfig;
import ar.edu.utn.farmacia.auth.UsuarioActual;
import ar.edu.utn.farmacia.common.ErrorDeCampoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.proveedor.ProveedorRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IngresoServiceTest {

  @Mock private LoteRepository loteRepository;
  @Mock private MovimientoStockRepository movimientoRepository;
  @Mock private MedicamentoRepository medicamentoRepository;
  @Mock private ProveedorRepository proveedorRepository;
  @Mock private UsuarioActual usuarioActual;

  private LoteService servicio;

  @BeforeEach
  void preparar() {
    servicio =
        new LoteService(
            loteRepository,
            movimientoRepository,
            medicamentoRepository,
            proveedorRepository,
            usuarioActual,
            Entidades.propiedades(),
            RelojFijoConfig.reloj());
    lenient()
        .when(medicamentoRepository.findById(10L))
        .thenReturn(Optional.of(Entidades.medicamento(10L, 5, true)));
    lenient()
        .when(proveedorRepository.findById(1L))
        .thenReturn(Optional.of(Entidades.proveedor(1L, true)));
  }

  @Test
  void rechazaUnaFechaDeVencimientoDeAyerConErrorDeCampo() {
    assertThatThrownBy(() -> servicio.ingresar(10L, pedido(HOY.minusDays(1))))
        .isInstanceOf(ErrorDeCampoException.class)
        .extracting("campo")
        .isEqualTo("fechaVencimiento");
    verify(loteRepository, never()).save(any());
  }

  @Test
  void aceptaUnaFechaDeVencimientoDeHoyYRegistraElIngreso() {
    when(usuarioActual.obtener()).thenReturn(Entidades.usuario(7L));
    when(loteRepository.save(any())).thenAnswer(invocacion -> invocacion.getArgument(0));
    when(loteRepository.stockDisponible(10L, HOY)).thenReturn(25L);

    IngresoResponse respuesta = servicio.ingresar(10L, pedido(HOY));

    assertThat(respuesta.stockTotalResultante()).isEqualTo(25);
    assertThat(respuesta.lote().fechaIngreso()).isEqualTo(HOY);
    assertThat(respuesta.lote().estado()).isEqualTo(EstadoLote.POR_VENCER);
    ArgumentCaptor<MovimientoStock> movimiento = ArgumentCaptor.forClass(MovimientoStock.class);
    verify(movimientoRepository).save(movimiento.capture());
    assertThat(movimiento.getValue().getTipo()).isEqualTo(TipoMovimiento.INGRESO);
    assertThat(movimiento.getValue().getCantidad()).isEqualTo(25);
    assertThat(movimiento.getValue().getSaldoResultante()).isEqualTo(25);
  }

  @Test
  void unNumeroDeLoteRepetidoDevuelve409() {
    when(loteRepository.existsByMedicamentoIdAndNumeroLote(10L, "L-1")).thenReturn(true);

    assertThatThrownBy(() -> servicio.ingresar(10L, pedido(HOY.plusDays(10))))
        .isInstanceOf(ReglaNegocioException.class)
        .extracting("codigo")
        .isEqualTo("LOTE_DUPLICADO");
  }

  private static IngresoRequest pedido(LocalDate vencimiento) {
    return new IngresoRequest(1L, "L-1", vencimiento, 25);
  }
}
