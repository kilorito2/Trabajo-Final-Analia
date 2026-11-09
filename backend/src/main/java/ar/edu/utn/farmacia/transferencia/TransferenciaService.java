package ar.edu.utn.farmacia.transferencia;

import ar.edu.utn.farmacia.area.Area;
import ar.edu.utn.farmacia.area.AreaRepository;
import ar.edu.utn.farmacia.auth.UsuarioActual;
import ar.edu.utn.farmacia.common.ErrorDeCampoException;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.common.ParametroInvalidoException;
import ar.edu.utn.farmacia.common.RecursoNoEncontradoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.lote.MovimientoStock;
import ar.edu.utn.farmacia.lote.MovimientoStockRepository;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.usuario.Usuario;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferenciaService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("fechaHora");
  static final int DIAS_MAXIMOS_EXPORTACION = 366;

  // FEFO: primero vence, primero sale. Con la misma fecha de vencimiento decide la fecha de
  // ingreso y después el id, para que el resultado sea siempre el mismo (y los tests, estables).
  static final Comparator<Lote> ORDEN_FEFO =
      Comparator.comparing(Lote::getFechaVencimiento)
          .thenComparing(Lote::getFechaIngreso)
          .thenComparing(Lote::getId);

  private static final Logger log = LoggerFactory.getLogger(TransferenciaService.class);

  private final TransferenciaRepository transferenciaRepository;
  private final AreaRepository areaRepository;
  private final MedicamentoRepository medicamentoRepository;
  private final LoteRepository loteRepository;
  private final MovimientoStockRepository movimientoRepository;
  private final UsuarioActual usuarioActual;
  private final Clock clock;

  @Transactional
  public TransferenciaResponse transferir(TransferenciaRequest pedido) {
    Map<Long, Integer> cantidades = sumarItems(pedido.items());
    Area area = buscarAreaActiva(pedido.areaId());
    Map<Long, Medicamento> medicamentos = buscarMedicamentosActivos(cantidades);

    LocalDate hoy = LocalDate.now(clock);
    // La consulta ya excluye los vencidos y los agotados; el filtro lo repite por las dudas.
    Map<Long, List<Lote>> lotes =
        loteRepository.bloquearDisponibles(cantidades.keySet(), hoy).stream()
            .filter(lote -> lote.tieneStock() && !lote.estaVencido(hoy))
            .sorted(ORDEN_FEFO)
            .collect(Collectors.groupingBy(lote -> lote.getMedicamento().getId()));

    // Todo o nada: primero se juntan todos los faltantes y, si hay alguno, no se toca nada.
    List<Faltante> faltantes = faltantes(cantidades, medicamentos, lotes);
    if (!faltantes.isEmpty()) {
      throw new StockInsuficienteException(faltantes);
    }

    Usuario usuario = usuarioActual.obtener();
    OffsetDateTime ahora = OffsetDateTime.now(clock);
    Transferencia transferencia = new Transferencia(ahora, area, usuario, pedido.observaciones());
    List<MovimientoStock> movimientos = new ArrayList<>();
    cantidades.forEach(
        (medicamentoId, cantidad) -> {
          int restante = cantidad;
          for (Lote lote : lotes.get(medicamentoId)) {
            if (restante == 0) {
              break;
            }
            int tomada = Math.min(restante, lote.getCantidadActual());
            lote.descontar(tomada);
            transferencia.agregarDetalle(new DetalleTransferencia(transferencia, lote, tomada));
            movimientos.add(MovimientoStock.egreso(lote, tomada, ahora, usuario, transferencia));
            restante -= tomada;
          }
        });
    Transferencia guardada = transferenciaRepository.save(transferencia);
    movimientoRepository.saveAll(movimientos);
    log.info(
        "Transferencia {} creada: {} ítems, {} lotes afectados",
        guardada.getId(),
        cantidades.size(),
        movimientos.size());
    return TransferenciaResponse.desde(guardada);
  }

  @Transactional(readOnly = true)
  public Page<TransferenciaResumen> listar(
      LocalDate desde, LocalDate hasta, Long areaId, Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    validarRango(desde, hasta);
    List<Specification<Transferencia>> filtros = new ArrayList<>();
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
    if (areaId != null) {
      filtros.add((raiz, consulta, cb) -> cb.equal(raiz.get("area").get("id"), areaId));
    }
    Page<Transferencia> transferencias =
        transferenciaRepository.findAll(Specification.allOf(filtros), pagina);
    Map<Long, TotalesTransferencia> totales = totales(transferencias.getContent());
    return transferencias.map(
        transferencia ->
            TransferenciaResumen.desde(transferencia, totales.get(transferencia.getId())));
  }

  @Transactional(readOnly = true)
  public List<TransferenciaResumen> ultimas(int cantidad) {
    return listar(
            null,
            null,
            null,
            PageRequest.of(0, cantidad, Sort.by(Sort.Direction.DESC, "fechaHora")))
        .getContent();
  }

  @Transactional(readOnly = true)
  public TransferenciaResponse obtener(Long id) {
    return transferenciaRepository
        .buscarCompleta(id)
        .map(TransferenciaResponse::desde)
        .orElseThrow(
            () -> new RecursoNoEncontradoException("No existe la transferencia " + id + "."));
  }

  /** Exporta todo lo filtrado, no solo la página visible. */
  @Transactional(readOnly = true)
  public byte[] exportar(LocalDate desde, LocalDate hasta, Long areaId) {
    validarRango(desde, hasta);
    if (ChronoUnit.DAYS.between(desde, hasta) + 1 > DIAS_MAXIMOS_EXPORTACION) {
      throw new ParametroInvalidoException(
          "PARAMETRO_INVALIDO",
          "El rango de fechas no puede superar los " + DIAS_MAXIMOS_EXPORTACION + " días.");
    }
    OffsetDateTime inicio = inicioDelDia(desde);
    OffsetDateTime fin = inicioDelDia(hasta.plusDays(1));
    List<DetalleTransferencia> lineas =
        areaId == null
            ? transferenciaRepository.detalleParaExportar(inicio, fin)
            : transferenciaRepository.detalleParaExportar(inicio, fin, areaId);
    return TransferenciaCsv.generar(lineas, clock.getZone());
  }

  private Map<Long, Integer> sumarItems(List<TransferenciaRequest.Item> items) {
    if (items == null || items.isEmpty()) {
      throw new ErrorDeCampoException("items", "Agregá al menos un medicamento.");
    }
    Map<Long, Integer> cantidades = new LinkedHashMap<>();
    for (int i = 0; i < items.size(); i++) {
      TransferenciaRequest.Item item = items.get(i);
      if (item.cantidad() == null || item.cantidad() <= 0) {
        throw new ErrorDeCampoException(
            "items[" + i + "].cantidad", "La cantidad tiene que ser mayor a 0.");
      }
      cantidades.merge(item.medicamentoId(), item.cantidad(), Integer::sum);
    }
    return cantidades;
  }

  private Area buscarAreaActiva(Long areaId) {
    Area area =
        areaRepository
            .findById(areaId)
            .orElseThrow(
                () -> new RecursoNoEncontradoException("No se encontró el área " + areaId + "."));
    if (!area.isActivo()) {
      throw new ReglaNegocioException(
          "AREA_INACTIVA", "El área " + area.getNombre() + " está inactiva.");
    }
    return area;
  }

  private Map<Long, Medicamento> buscarMedicamentosActivos(Map<Long, Integer> cantidades) {
    Map<Long, Medicamento> medicamentos =
        medicamentoRepository.findAllById(cantidades.keySet()).stream()
            .collect(Collectors.toMap(Medicamento::getId, Function.identity()));
    for (Long id : cantidades.keySet()) {
      Medicamento medicamento = medicamentos.get(id);
      if (medicamento == null) {
        throw new RecursoNoEncontradoException("No existe el medicamento " + id + ".");
      }
      if (!medicamento.isActivo()) {
        throw new ReglaNegocioException(
            "MEDICAMENTO_INACTIVO",
            "El medicamento " + medicamento.descripcion() + " está inactivo.");
      }
    }
    return medicamentos;
  }

  private static List<Faltante> faltantes(
      Map<Long, Integer> cantidades,
      Map<Long, Medicamento> medicamentos,
      Map<Long, List<Lote>> lotes) {
    List<Faltante> faltantes = new ArrayList<>();
    cantidades.forEach(
        (medicamentoId, solicitado) -> {
          long disponible =
              lotes.getOrDefault(medicamentoId, List.of()).stream()
                  .mapToLong(Lote::getCantidadActual)
                  .sum();
          if (disponible < solicitado) {
            faltantes.add(
                new Faltante(
                    medicamentoId,
                    medicamentos.get(medicamentoId).descripcion(),
                    disponible,
                    solicitado));
          }
        });
    return faltantes;
  }

  private Map<Long, TotalesTransferencia> totales(List<Transferencia> transferencias) {
    if (transferencias.isEmpty()) {
      return Map.of();
    }
    return transferenciaRepository
        .totales(transferencias.stream().map(Transferencia::getId).toList())
        .stream()
        .collect(Collectors.toMap(TotalesTransferencia::transferenciaId, Function.identity()));
  }

  private static void validarRango(LocalDate desde, LocalDate hasta) {
    if (desde != null && hasta != null && hasta.isBefore(desde)) {
      throw new ParametroInvalidoException(
          "PARAMETRO_INVALIDO", "La fecha 'hasta' no puede ser anterior a 'desde'.");
    }
  }

  private OffsetDateTime inicioDelDia(LocalDate dia) {
    return dia.atStartOfDay(clock.getZone()).toOffsetDateTime();
  }
}
