package ar.edu.utn.farmacia.proveedor;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.common.RecursoNoEncontradoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProveedorService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("razonSocial");

  private final ProveedorRepository proveedorRepository;
  private final Exportador exportador;

  @Transactional(readOnly = true)
  public Page<ProveedorResponse> listar(String q, Boolean activo, Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    Page<Proveedor> proveedores = proveedorRepository.findAll(filtro(q, activo), pagina);
    Map<Long, Long> lotes = contarLotes(proveedores.map(Proveedor::getId).getContent());
    return proveedores.map(
        proveedor -> ProveedorResponse.desde(proveedor, lotes.getOrDefault(proveedor.getId(), 0L)));
  }

  /** Reporte con los mismos filtros que el listado, ordenado por razón social. */
  @Transactional(readOnly = true)
  public byte[] exportar(String q, Boolean activo, FormatoReporte formato) {
    List<Proveedor> proveedores =
        proveedorRepository.findAll(filtro(q, activo), Sort.by("razonSocial"));
    Map<Long, Long> lotes = contarLotes(proveedores.stream().map(Proveedor::getId).toList());
    List<ProveedorResponse> filas =
        proveedores.stream()
            .map(
                proveedor ->
                    ProveedorResponse.desde(proveedor, lotes.getOrDefault(proveedor.getId(), 0L)))
            .toList();
    return exportador.generar(ProveedorReporte.generar(filas, q, activo), formato);
  }

  private Specification<Proveedor> filtro(String q, Boolean activo) {
    List<Specification<Proveedor>> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      String patron = "%" + q.strip().toLowerCase(Locale.ROOT) + "%";
      String patronCuit = "%" + Cuits.normalizar(q) + "%";
      filtros.add(
          (raiz, consulta, cb) ->
              cb.or(
                  cb.like(cb.lower(raiz.get("razonSocial")), patron),
                  cb.like(raiz.get("cuit"), patronCuit)));
    }
    if (activo != null) {
      filtros.add((raiz, consulta, cb) -> cb.equal(raiz.get("activo"), activo));
    }
    return Specification.allOf(filtros);
  }

  @Transactional(readOnly = true)
  public ProveedorResponse obtener(Long id) {
    return respuesta(buscar(id));
  }

  @Transactional
  public ProveedorResponse crear(ProveedorRequest pedido) {
    if (proveedorRepository.existsByCuit(pedido.cuit())) {
      throw cuitDuplicado(pedido.cuit());
    }
    Proveedor proveedor =
        new Proveedor(pedido.razonSocial(), pedido.cuit(), pedido.telefono(), pedido.email());
    return ProveedorResponse.desde(proveedorRepository.save(proveedor), 0);
  }

  @Transactional
  public ProveedorResponse editar(Long id, ProveedorRequest pedido) {
    Proveedor proveedor = buscar(id);
    if (proveedorRepository.existsByCuitAndIdNot(pedido.cuit(), id)) {
      throw cuitDuplicado(pedido.cuit());
    }
    proveedor.setRazonSocial(pedido.razonSocial());
    proveedor.setCuit(pedido.cuit());
    proveedor.setTelefono(pedido.telefono());
    proveedor.setEmail(pedido.email());
    return respuesta(proveedor);
  }

  // Se permite aunque tenga lotes con stock: dejar de comprarle no hace desaparecer su mercadería.
  // Los lotes siguen disponibles; lo único que cambia es que no se puede elegir en ingresos nuevos.
  @Transactional
  public void cambiarEstado(Long id, boolean activo) {
    buscar(id).setActivo(activo);
  }

  private ProveedorResponse respuesta(Proveedor proveedor) {
    long lotes = contarLotes(List.of(proveedor.getId())).getOrDefault(proveedor.getId(), 0L);
    return ProveedorResponse.desde(proveedor, lotes);
  }

  private Map<Long, Long> contarLotes(List<Long> ids) {
    if (ids.isEmpty()) {
      return Map.of();
    }
    return proveedorRepository.contarLotesConStock(ids).stream()
        .collect(Collectors.toMap(LotesConStock::proveedorId, LotesConStock::cantidad));
  }

  private Proveedor buscar(Long id) {
    return proveedorRepository
        .findById(id)
        .orElseThrow(() -> new RecursoNoEncontradoException("No existe el proveedor " + id + "."));
  }

  private static ReglaNegocioException cuitDuplicado(String cuit) {
    return new ReglaNegocioException(
        "CUIT_DUPLICADO", "Ya existe un proveedor con el CUIT " + Cuits.formatear(cuit) + ".");
  }
}
