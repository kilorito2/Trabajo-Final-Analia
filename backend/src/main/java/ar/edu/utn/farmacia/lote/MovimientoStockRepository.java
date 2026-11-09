package ar.edu.utn.farmacia.lote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MovimientoStockRepository
    extends JpaRepository<MovimientoStock, Long>, JpaSpecificationExecutor<MovimientoStock> {

  @Override
  @EntityGraph(attributePaths = {"lote", "lote.medicamento", "usuario"})
  Page<MovimientoStock> findAll(Specification<MovimientoStock> filtro, Pageable pagina);
}
