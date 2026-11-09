package ar.edu.utn.farmacia.area;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AreaRepository extends JpaRepository<Area, Long>, JpaSpecificationExecutor<Area> {

  boolean existsByNombreIgnoreCase(String nombre);

  boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);
}
