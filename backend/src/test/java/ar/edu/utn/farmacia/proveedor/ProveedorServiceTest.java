package ar.edu.utn.farmacia.proveedor;

import static ar.edu.utn.farmacia.RelojFijoConfig.HOY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ar.edu.utn.farmacia.Entidades;
import ar.edu.utn.farmacia.RelojFijoConfig;
import ar.edu.utn.farmacia.area.AreaRepository;
import ar.edu.utn.farmacia.auth.UsuarioActual;
import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import ar.edu.utn.farmacia.lote.IngresoRequest;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.lote.LoteService;
import ar.edu.utn.farmacia.lote.MovimientoStockRepository;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.transferencia.TransferenciaRepository;
import ar.edu.utn.farmacia.transferencia.TransferenciaRequest;
import ar.edu.utn.farmacia.transferencia.TransferenciaService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProveedorServiceTest {

  @Mock private ProveedorRepository proveedorRepository;
  @Mock private MedicamentoRepository medicamentoRepository;
  @Mock private LoteRepository loteRepository;
  @Mock private MovimientoStockRepository movimientoRepository;
  @Mock private UsuarioActual usuarioActual;

  @Test
  void laBajaEsLogicaYSePermiteConLotesConStock() {
    Proveedor proveedor = Entidades.proveedor(1L, true);
    when(proveedorRepository.findById(1L)).thenReturn(Optional.of(proveedor));

    new ProveedorService(proveedorRepository, null).cambiarEstado(1L, false);

    assertThat(proveedor.isActivo()).isFalse();
    verify(proveedorRepository, never()).delete(any(Proveedor.class));
    verify(proveedorRepository, never()).deleteById(any());
  }

  @Test
  void losLotesDeUnProveedorInactivoSiguenDisponiblesParaTransferir() {
    Medicamento medicamento = Entidades.medicamento(10L, 0, true);
    Lote lote = Entidades.lote(1L, medicamento, HOY.plusDays(30), HOY, 50);
    lote.getProveedor().setActivo(false);
    AreaRepository areaRepository = mock(AreaRepository.class);
    TransferenciaRepository transferenciaRepository = mock(TransferenciaRepository.class);
    when(areaRepository.findById(1L)).thenReturn(Optional.of(Entidades.area(1L, true)));
    when(medicamentoRepository.findAllById(anyIterable())).thenReturn(List.of(medicamento));
    when(loteRepository.bloquearDisponibles(anyCollection(), any())).thenReturn(List.of(lote));
    when(usuarioActual.obtener()).thenReturn(Entidades.usuario(7L));
    when(transferenciaRepository.save(any())).thenAnswer(invocacion -> invocacion.getArgument(0));
    TransferenciaService transferencias =
        new TransferenciaService(
            transferenciaRepository,
            areaRepository,
            medicamentoRepository,
            loteRepository,
            movimientoRepository,
            usuarioActual,
            new Exportador(RelojFijoConfig.reloj()),
            RelojFijoConfig.reloj());

    transferencias.transferir(
        new TransferenciaRequest(1L, null, List.of(new TransferenciaRequest.Item(10L, 20))));

    assertThat(lote.getCantidadActual()).isEqualTo(30);
  }

  @Test
  void unProveedorInactivoNoSePuedeElegirEnUnIngresoNuevo() {
    when(medicamentoRepository.findById(10L))
        .thenReturn(Optional.of(Entidades.medicamento(10L, 0, true)));
    when(proveedorRepository.findById(1L)).thenReturn(Optional.of(Entidades.proveedor(1L, false)));
    LoteService lotes =
        new LoteService(
            loteRepository,
            movimientoRepository,
            medicamentoRepository,
            proveedorRepository,
            usuarioActual,
            Entidades.propiedades(),
            new Exportador(RelojFijoConfig.reloj()),
            RelojFijoConfig.reloj());

    assertThatThrownBy(
            () -> lotes.ingresar(10L, new IngresoRequest(1L, "L-1", HOY.plusDays(100), 10)))
        .isInstanceOf(ReglaNegocioException.class)
        .extracting("codigo")
        .isEqualTo("PROVEEDOR_INACTIVO");
    verify(loteRepository, never()).save(any());
  }
}
