package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Ordenamiento;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MovimientoService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("fechaHora");

  private final MovimientoStockRepository movimientoRepository;
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
    return movimientoRepository
        .findAll(Specification.allOf(filtros), pagina)
        .map(MovimientoResponse::desde);
  }

  private OffsetDateTime inicioDelDia(LocalDate dia) {
    return dia.atStartOfDay(clock.getZone()).toOffsetDateTime();
  }
}
