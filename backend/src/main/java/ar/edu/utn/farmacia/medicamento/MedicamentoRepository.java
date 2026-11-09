package ar.edu.utn.farmacia.medicamento;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicamentoRepository
    extends JpaRepository<Medicamento, Long>, MedicamentoConsultas {

  boolean existsByCodigo(String codigo);

  boolean existsByCodigoAndIdNot(String codigo, Long id);

  long countByActivoTrue();
}
