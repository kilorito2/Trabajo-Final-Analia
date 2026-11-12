package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MovimientoService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("fechaHora");

  private final MovimientoStockRepository movimientoRepository;
  private final MedicamentoRepository medicamentoRepository;
  private final Exportador exportador;
  private final Clock clock;

  @Transactional(readOnly = true)
  public Page<MovimientoResponse> listar(
      Long loteId,
      Long medicamentoId,
      TipoMovimiento tipo,
      LocalDate desde,
      LocalDate hasta,
      Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    return movimientoRepository
        .findAll(filtro(loteId, medicamentoId, tipo, desde, hasta), pagina)
        .map(MovimientoResponse::desde);
  }

  /** Reporte con los mismos filtros que el listado, del más reciente al más antiguo. */
  @Transactional(readOnly = true)
  public byte[] exportar(
      Long loteId,
      Long medicamentoId,
      TipoMovimiento tipo,
      LocalDate desde,
      LocalDate hasta,
      FormatoReporte formato) {
    List<MovimientoResponse> movimientos =
        movimientoRepository
            .findAll(
                filtro(loteId, medicamentoId, tipo, desde, hasta),
                Sort.by(Sort.Direction.DESC, "fechaHora", "id"))
            .stream()
            .map(MovimientoResponse::desde)
            .toList();
    String medicamento =
        medicamentoId == null
            ? null
            : medicamentoRepository
                .findById(medicamentoId)
                .map(Medicamento::descripcion)
                .orElse("#" + medicamentoId);
    return exportador.generar(
        MovimientoReporte.generar(movimientos, clock.getZone(), medicamento, tipo, desde, hasta),
        formato);
  }

  private Specification<MovimientoStock> filtro(
      Long loteId, Long medicamentoId, TipoMovimiento tipo, LocalDate desde, LocalDate hasta) {
    List<Specification<MovimientoStock>> filtros = new ArrayList<>();
    if (loteId != null) {
      filtros.add((raiz, consulta, cb) -> cb.equal(raiz.get("lote").get("id"), loteId));
    }
    if (medicamentoId != null) {
      filtros.add(
          (raiz, consulta, cb) ->
              cb.equal(raiz.get("lote").get("medicamento").get("id"), medicamentoId));
    }
    if (tipo != null) {
      filtros.add((raiz, consulta, cb) -> cb.equal(raiz.get("tipo"), tipo));
    }
    if (desde != null) {
      OffsetDateTime inicio = inicioDelDia(desde);
      filtros.add(
          (raiz, consulta, cb) ->
              cb.greaterThanOrEqualTo(raiz.<OffsetDateTime>get("fechaHora"), inicio));
    }
    if (hasta != null) {
      OffsetDateTime fin = inicioDelDia(hasta.plusDays(1));
      filtros.add((raiz, consulta, cb) -> cb.lessThan(raiz.<OffsetDateTime>get("fechaHora"), fin));
    }
    return Specification.allOf(filtros);
  }

  private OffsetDateTime inicioDelDia(LocalDate dia) {
    return dia.atStartOfDay(clock.getZone()).toOffsetDateTime();
  }
}
