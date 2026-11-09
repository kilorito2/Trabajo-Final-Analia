package ar.edu.utn.farmacia.lote;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface LoteRepository extends JpaRepository<Lote, Long>, JpaSpecificationExecutor<Lote> {

  // Bloquea en una sola consulta todos los lotes que la transferencia puede usar. El orden por id
  // es fijo: dos transferencias que piden los mismos medicamentos en distinto orden toman los
  // bloqueos en el mismo orden, y así no se pueden trabar entre sí (deadlock).
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
      select l from Lote l
      where l.medicamento.id in :medicamentoIds
        and l.cantidadActual > 0
        and l.fechaVencimiento >= :hoy
      order by l.id
      """)
  List<Lote> bloquearDisponibles(Collection<Long> medicamentoIds, LocalDate hoy);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select l from Lote l where l.id = :id")
  Optional<Lote> bloquear(Long id);

  boolean existsByMedicamentoIdAndNumeroLote(Long medicamentoId, String numeroLote);

  @Query(
      """
      select coalesce(sum(l.cantidadActual), 0L) from Lote l
      where l.medicamento.id = :medicamentoId and l.fechaVencimiento >= :hoy
      """)
  Long stockDisponible(Long medicamentoId, LocalDate hoy);

  @Query(
      """
      select min(l.fechaVencimiento) from Lote l
      where l.medicamento.id = :medicamentoId
        and l.cantidadActual > 0
        and l.fechaVencimiento >= :hoy
      """)
  Optional<LocalDate> proximoVencimiento(Long medicamentoId, LocalDate hoy);

  @Query(
      """
      select l from Lote l join fetch l.proveedor
      where l.medicamento.id = :medicamentoId and l.cantidadActual > 0
      order by l.fechaVencimiento, l.fechaIngreso, l.id
      """)
  List<Lote> conStockEnOrdenFefo(Long medicamentoId);

  /** Lotes con stock que vencen hasta la fecha límite, incluidos los ya vencidos. */
  @Query(
      """
      select l from Lote l join fetch l.medicamento
      where l.cantidadActual > 0 and l.fechaVencimiento <= :limite
      order by l.fechaVencimiento, l.id
      """)
  List<Lote> conStockQueVencenHasta(LocalDate limite);

  @Override
  @EntityGraph(attributePaths = {"medicamento", "proveedor"})
  Page<Lote> findAll(Specification<Lote> filtro, Pageable pagina);
}
