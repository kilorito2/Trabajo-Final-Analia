package ar.edu.utn.farmacia.medicamento;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FarmaciaProperties;
import ar.edu.utn.farmacia.common.FormatoReporte;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.common.RecursoNoEncontradoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.lote.LoteResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicamentoService {

  static final Set<String> ORDEN_PERMITIDO =
      Set.of("codigo", "nombre", "stockTotal", "proximoVencimiento");

  private final MedicamentoRepository medicamentoRepository;
  private final LoteRepository loteRepository;
  private final FarmaciaProperties propiedades;
  private final Exportador exportador;
  private final Clock clock;

  @Transactional(readOnly = true)
  public Page<MedicamentoResponse> listar(FiltroMedicamentos filtro, Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    return medicamentoRepository
        .buscarConStock(filtro, LocalDate.now(clock), pagina)
        .map(MedicamentoResponse::desde);
  }

  /** Reporte de stock con los mismos filtros que el listado, sin paginar. */
  @Transactional(readOnly = true)
  public byte[] exportar(FiltroMedicamentos filtro, FormatoReporte formato) {
    List<MedicamentoConStock> filas =
        medicamentoRepository.todosConStock(
            filtro, LocalDate.now(clock), Sort.by("nombre", "codigo"));
    return exportador.generar(MedicamentoReporte.generar(filas, filtro), formato);
  }

  @Transactional(readOnly = true)
  public MedicamentoDetalleResponse obtener(Long id) {
    Medicamento medicamento = buscar(id);
    LocalDate hoy = LocalDate.now(clock);
    int diasPorVencer = propiedades.alertas().diasPorVencer();
    List<LoteResponse> lotes =
        loteRepository.conStockEnOrdenFefo(id).stream()
            .map(lote -> LoteResponse.desde(lote, hoy, diasPorVencer))
            .toList();
    return MedicamentoDetalleResponse.desde(respuesta(medicamento, hoy), lotes);
  }

  @Transactional
  public MedicamentoResponse crear(MedicamentoRequest pedido) {
    if (medicamentoRepository.existsByCodigo(pedido.codigo())) {
      throw codigoDuplicado(pedido.codigo());
    }
    Medicamento medicamento =
        medicamentoRepository.save(
            new Medicamento(
                pedido.codigo(), pedido.nombre(), pedido.presentacion(), pedido.stockMinimo()));
    return MedicamentoResponse.desde(medicamento, 0, null);
  }

  @Transactional
  public MedicamentoResponse editar(Long id, MedicamentoRequest pedido) {
    Medicamento medicamento = buscar(id);
    if (medicamentoRepository.existsByCodigoAndIdNot(pedido.codigo(), id)) {
      throw codigoDuplicado(pedido.codigo());
    }
    medicamento.setCodigo(pedido.codigo());
    medicamento.setNombre(pedido.nombre());
    medicamento.setPresentacion(pedido.presentacion());
    medicamento.setStockMinimo(pedido.stockMinimo());
    return respuesta(medicamento, LocalDate.now(clock));
  }

  @Transactional
  public void cambiarEstado(Long id, boolean activo) {
    Medicamento medicamento = buscar(id);
    if (!activo && loteRepository.stockDisponible(id, LocalDate.now(clock)) > 0) {
      throw new ReglaNegocioException(
          "MEDICAMENTO_CON_STOCK",
          "No se puede dar de baja "
              + medicamento.descripcion()
              + " porque todavía tiene stock sin vencer.");
    }
    medicamento.setActivo(activo);
  }

  private MedicamentoResponse respuesta(Medicamento medicamento, LocalDate hoy) {
    long stock = loteRepository.stockDisponible(medicamento.getId(), hoy);
    LocalDate proximo = loteRepository.proximoVencimiento(medicamento.getId(), hoy).orElse(null);
    return MedicamentoResponse.desde(medicamento, stock, proximo);
  }

  private Medicamento buscar(Long id) {
    return medicamentoRepository
        .findById(id)
        .orElseThrow(
            () -> new RecursoNoEncontradoException("No existe el medicamento " + id + "."));
  }

  private static ReglaNegocioException codigoDuplicado(String codigo) {
    return new ReglaNegocioException(
        "CODIGO_DUPLICADO", "Ya existe un medicamento con el código " + codigo + ".");
  }
}
