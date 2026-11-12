package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.auth.UsuarioActual;
import ar.edu.utn.farmacia.common.ErrorDeCampoException;
import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FarmaciaProperties;
import ar.edu.utn.farmacia.common.FormatoReporte;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.common.RecursoNoEncontradoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.proveedor.Proveedor;
import ar.edu.utn.farmacia.proveedor.ProveedorRepository;
import ar.edu.utn.farmacia.usuario.Usuario;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoteService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("fechaVencimiento", "fechaIngreso");

  private static final Logger log = LoggerFactory.getLogger(LoteService.class);

  private final LoteRepository loteRepository;
  private final MovimientoStockRepository movimientoRepository;
  private final MedicamentoRepository medicamentoRepository;
  private final ProveedorRepository proveedorRepository;
  private final UsuarioActual usuarioActual;
  private final FarmaciaProperties propiedades;
  private final Exportador exportador;
  private final Clock clock;

  @Transactional
  public IngresoResponse ingresar(Long medicamentoId, IngresoRequest pedido) {
    LocalDate hoy = LocalDate.now(clock);
    Medicamento medicamento = buscarMedicamento(medicamentoId);
    if (!medicamento.isActivo()) {
      throw new ReglaNegocioException(
          "MEDICAMENTO_INACTIVO",
          "El medicamento " + medicamento.descripcion() + " está inactivo.");
    }
    Proveedor proveedor = buscarProveedor(pedido.proveedorId());
    if (!proveedor.isActivo()) {
      throw new ReglaNegocioException(
          "PROVEEDOR_INACTIVO", "El proveedor " + proveedor.getRazonSocial() + " está inactivo.");
    }
    if (pedido.fechaVencimiento().isBefore(hoy)) {
      throw new ErrorDeCampoException(
          "fechaVencimiento", "La fecha de vencimiento no puede ser anterior a hoy.");
    }
    if (loteRepository.existsByMedicamentoIdAndNumeroLote(medicamentoId, pedido.numeroLote())) {
      throw new ReglaNegocioException(
          "LOTE_DUPLICADO",
          "El lote "
              + pedido.numeroLote()
              + " ya está registrado para "
              + medicamento.descripcion()
              + ".");
    }

    Usuario usuario = usuarioActual.obtener();
    OffsetDateTime ahora = OffsetDateTime.now(clock);
    Lote lote =
        loteRepository.save(
            new Lote(
                medicamento,
                proveedor,
                pedido.numeroLote(),
                pedido.fechaVencimiento(),
                pedido.cantidad(),
                hoy,
                usuario,
                ahora));
    movimientoRepository.save(MovimientoStock.ingreso(lote, ahora, usuario));
    long stockTotal = loteRepository.stockDisponible(medicamentoId, hoy);
    return new IngresoResponse(respuesta(lote, hoy), stockTotal);
  }

  @Transactional(readOnly = true)
  public Page<LoteResponse> listar(
      String q, Long medicamentoId, Set<EstadoLote> estados, Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    LocalDate hoy = LocalDate.now(clock);
    return loteRepository
        .findAll(filtro(q, medicamentoId, estados, hoy), pagina)
        .map(lote -> respuesta(lote, hoy));
  }

  /** Reporte de lotes con los mismos filtros que el listado, ordenado por vencimiento. */
  @Transactional(readOnly = true)
  public byte[] exportar(
      String q, Long medicamentoId, Set<EstadoLote> estados, FormatoReporte formato) {
    LocalDate hoy = LocalDate.now(clock);
    List<LoteResponse> lotes =
        loteRepository
            .findAll(
                filtro(q, medicamentoId, estados, hoy),
                Sort.by("fechaVencimiento", "fechaIngreso", "id"))
            .stream()
            .map(lote -> respuesta(lote, hoy))
            .toList();
    return exportador.generar(LoteReporte.generar(lotes, q, estados), formato);
  }

  private Specification<Lote> filtro(
      String q, Long medicamentoId, Set<EstadoLote> estados, LocalDate hoy) {
    LocalDate limite = hoy.plusDays(propiedades.alertas().diasPorVencer());
    List<Specification<Lote>> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      filtros.add(busqueda(q));
    }
    if (medicamentoId != null) {
      filtros.add(
          (raiz, consulta, cb) -> cb.equal(raiz.get("medicamento").get("id"), medicamentoId));
    }
    if (estados != null && !estados.isEmpty()) {
      filtros.add(
          (raiz, consulta, cb) ->
              cb.or(
                  estados.stream()
                      .map(estado -> condicionDeEstado(estado, raiz, cb, hoy, limite))
                      .toArray(Predicate[]::new)));
    }
    return Specification.allOf(filtros);
  }

  /** Busca el texto en el código, nombre o presentación del medicamento, el lote y el proveedor. */
  private static Specification<Lote> busqueda(String q) {
    String patron = "%" + q.strip().toLowerCase(Locale.ROOT) + "%";
    return (raiz, consulta, cb) -> {
      Join<Lote, Medicamento> medicamento = raiz.join("medicamento");
      Join<Lote, Proveedor> proveedor = raiz.join("proveedor");
      return cb.or(
          cb.like(cb.lower(medicamento.get("codigo")), patron),
          cb.like(cb.lower(medicamento.get("nombre")), patron),
          cb.like(cb.lower(medicamento.get("presentacion")), patron),
          cb.like(cb.lower(raiz.get("numeroLote")), patron),
          cb.like(cb.lower(proveedor.get("razonSocial")), patron));
    };
  }

  @Transactional
  public LoteResponse darDeBaja(Long id, BajaRequest pedido) {
    LocalDate hoy = LocalDate.now(clock);
    Lote lote = bloquear(id);
    if (!lote.estaVencido(hoy)) {
      throw new ReglaNegocioException(
          "LOTE_NO_VENCIDO",
          "El lote " + lote.getNumeroLote() + " todavía no venció: no se puede dar de baja.");
    }
    if (!lote.tieneStock()) {
      throw new ReglaNegocioException(
          "LOTE_SIN_STOCK", "El lote " + lote.getNumeroLote() + " ya no tiene stock.");
    }
    int baja = lote.darDeBaja();
    movimientoRepository.save(
        MovimientoStock.bajaPorVencimiento(
            lote, baja, OffsetDateTime.now(clock), usuarioActual.obtener(), pedido.motivo()));
    log.info("Baja por vencimiento del lote {} ({} unidades)", lote.getId(), baja);
    return respuesta(lote, hoy);
  }

  @Transactional
  public LoteResponse ajustar(Long id, AjusteRequest pedido) {
    Lote lote = bloquear(id);
    int cantidadNueva = pedido.cantidadNueva();
    if (cantidadNueva > lote.getCantidadInicial()) {
      throw new ErrorDeCampoException(
          "cantidadNueva",
          "La cantidad no puede superar la cantidad inicial del lote ("
              + lote.getCantidadInicial()
              + ").");
    }
    if (cantidadNueva == lote.getCantidadActual()) {
      throw new ErrorDeCampoException(
          "cantidadNueva", "La cantidad nueva es igual a la actual: no hay nada que ajustar.");
    }
    int diferencia = lote.ajustar(cantidadNueva);
    movimientoRepository.save(
        MovimientoStock.ajuste(
            lote, diferencia, OffsetDateTime.now(clock), usuarioActual.obtener(), pedido.motivo()));
    log.info("Ajuste del lote {} ({} unidades)", lote.getId(), diferencia);
    return respuesta(lote, LocalDate.now(clock));
  }

  private LoteResponse respuesta(Lote lote, LocalDate hoy) {
    return LoteResponse.desde(lote, hoy, propiedades.alertas().diasPorVencer());
  }

  private static Predicate condicionDeEstado(
      EstadoLote estado, Root<Lote> raiz, CriteriaBuilder cb, LocalDate hoy, LocalDate limite) {
    var cantidad = raiz.<Integer>get("cantidadActual");
    var vencimiento = raiz.<LocalDate>get("fechaVencimiento");
    return switch (estado) {
      case AGOTADO -> cb.equal(cantidad, 0);
      case VENCIDO -> cb.and(cb.greaterThan(cantidad, 0), cb.lessThan(vencimiento, hoy));
      case POR_VENCER -> cb.and(cb.greaterThan(cantidad, 0), cb.between(vencimiento, hoy, limite));
      case VIGENTE -> cb.and(cb.greaterThan(cantidad, 0), cb.greaterThan(vencimiento, limite));
    };
  }

  private Lote bloquear(Long id) {
    return loteRepository
        .bloquear(id)
        .orElseThrow(() -> new RecursoNoEncontradoException("No existe el lote " + id + "."));
  }

  private Medicamento buscarMedicamento(Long id) {
    return medicamentoRepository
        .findById(id)
        .orElseThrow(
            () -> new RecursoNoEncontradoException("No existe el medicamento " + id + "."));
  }

  private Proveedor buscarProveedor(Long id) {
    return proveedorRepository
        .findById(id)
        .orElseThrow(() -> new RecursoNoEncontradoException("No existe el proveedor " + id + "."));
  }
}
