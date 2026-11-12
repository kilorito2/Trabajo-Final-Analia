package ar.edu.utn.farmacia.area;

import ar.edu.utn.farmacia.common.Exportador;
import ar.edu.utn.farmacia.common.FormatoReporte;
import ar.edu.utn.farmacia.common.Ordenamiento;
import ar.edu.utn.farmacia.common.RecursoNoEncontradoException;
import ar.edu.utn.farmacia.common.ReglaNegocioException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
public class AreaService {

  static final Set<String> ORDEN_PERMITIDO = Set.of("nombre");

  private final AreaRepository areaRepository;
  private final Exportador exportador;

  @Transactional(readOnly = true)
  public Page<AreaResponse> listar(String q, Boolean activo, Pageable pagina) {
    Ordenamiento.validar(pagina.getSort(), ORDEN_PERMITIDO);
    return areaRepository.findAll(filtro(q, activo), pagina).map(AreaResponse::desde);
  }

  @Transactional(readOnly = true)
  public byte[] exportar(String q, Boolean activo, FormatoReporte formato) {
    List<AreaResponse> areas =
        areaRepository.findAll(filtro(q, activo), Sort.by("nombre")).stream()
            .map(AreaResponse::desde)
            .toList();
    return exportador.generar(AreaReporte.generar(areas, q, activo), formato);
  }

  private static Specification<Area> filtro(String q, Boolean activo) {
    List<Specification<Area>> filtros = new ArrayList<>();
    if (q != null && !q.isBlank()) {
      String patron = "%" + q.strip().toLowerCase(Locale.ROOT) + "%";
      filtros.add((raiz, consulta, cb) -> cb.like(cb.lower(raiz.get("nombre")), patron));
    }
    if (activo != null) {
      filtros.add((raiz, consulta, cb) -> cb.equal(raiz.get("activo"), activo));
    }
    return Specification.allOf(filtros);
  }

  @Transactional
  public AreaResponse crear(AreaRequest pedido) {
    if (areaRepository.existsByNombreIgnoreCase(pedido.nombre())) {
      throw nombreDuplicado(pedido.nombre());
    }
    return AreaResponse.desde(areaRepository.save(new Area(pedido.nombre())));
  }

  @Transactional
  public AreaResponse editar(Long id, AreaRequest pedido) {
    Area area = buscar(id);
    if (areaRepository.existsByNombreIgnoreCaseAndIdNot(pedido.nombre(), id)) {
      throw nombreDuplicado(pedido.nombre());
    }
    area.setNombre(pedido.nombre());
    return AreaResponse.desde(area);
  }

  @Transactional
  public void cambiarEstado(Long id, boolean activo) {
    buscar(id).setActivo(activo);
  }

  private Area buscar(Long id) {
    return areaRepository
        .findById(id)
        .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el área " + id + "."));
  }

  private static ReglaNegocioException nombreDuplicado(String nombre) {
    return new ReglaNegocioException(
        "NOMBRE_DUPLICADO", "Ya existe un área llamada '" + nombre + "'.");
  }
}
