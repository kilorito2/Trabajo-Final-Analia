package ar.edu.utn.farmacia.medicamento;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Consultas con el stock calculado en la base, sin cargar los lotes en memoria. */
public interface MedicamentoConsultas {

  Page<MedicamentoConStock> buscarConStock(
      FiltroMedicamentos filtro, LocalDate hoy, Pageable pagina);

  List<MedicamentoConStock> activosConStock(LocalDate hoy);
}
