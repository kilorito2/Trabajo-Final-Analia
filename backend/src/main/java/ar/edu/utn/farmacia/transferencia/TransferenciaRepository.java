package ar.edu.utn.farmacia.transferencia;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface TransferenciaRepository
    extends JpaRepository<Transferencia, Long>, JpaSpecificationExecutor<Transferencia> {

  @Override
  @EntityGraph(attributePaths = {"area", "realizadaPor"})
  Page<Transferencia> findAll(Specification<Transferencia> filtro, Pageable pagina);

  @Query(
      """
      select t from Transferencia t
      join fetch t.area
      join fetch t.realizadaPor
      where t.id = :id
      """)
  Optional<Transferencia> buscarCompleta(Long id);

  @Query(
      """
      select new ar.edu.utn.farmacia.transferencia.TotalesTransferencia(
          d.transferencia.id, count(d), sum(d.cantidad))
      from DetalleTransferencia d
      where d.transferencia.id in :ids
      group by d.transferencia.id
      """)
  List<TotalesTransferencia> totales(Collection<Long> ids);

  @Query(
      """
      select d from DetalleTransferencia d
      join fetch d.transferencia t
      join fetch t.area
      join fetch t.realizadaPor
      join fetch d.lote l
      join fetch l.medicamento
      where t.fechaHora >= :desde and t.fechaHora < :hasta
      order by t.fechaHora, t.id, d.id
      """)
  List<DetalleTransferencia> detalleParaExportar(OffsetDateTime desde, OffsetDateTime hasta);

  @Query(
      """
      select d from DetalleTransferencia d
      join fetch d.transferencia t
      join fetch t.area
      join fetch t.realizadaPor
      join fetch d.lote l
      join fetch l.medicamento
      where t.fechaHora >= :desde and t.fechaHora < :hasta and t.area.id = :areaId
      order by t.fechaHora, t.id, d.id
      """)
  List<DetalleTransferencia> detalleParaExportar(
      OffsetDateTime desde, OffsetDateTime hasta, Long areaId);

  long countByFechaHoraGreaterThanEqualAndFechaHoraLessThan(
      OffsetDateTime desde, OffsetDateTime hasta);

  @Query(
      """
      select new ar.edu.utn.farmacia.transferencia.EgresoPorArea(a.id, a.nombre, sum(d.cantidad))
      from DetalleTransferencia d
      join d.transferencia t
      join t.area a
      where t.fechaHora >= :desde
      group by a.id, a.nombre
      order by sum(d.cantidad) desc, a.nombre
      """)
  List<EgresoPorArea> egresosPorArea(OffsetDateTime desde);
}
