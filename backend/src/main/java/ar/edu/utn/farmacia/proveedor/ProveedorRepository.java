package ar.edu.utn.farmacia.proveedor;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProveedorRepository
    extends JpaRepository<Proveedor, Long>, JpaSpecificationExecutor<Proveedor> {

  boolean existsByCuit(String cuit);

  boolean existsByCuitAndIdNot(String cuit, Long id);

  @Query(
      """
      select new ar.edu.utn.farmacia.proveedor.LotesConStock(l.proveedor.id, count(l))
      from Lote l
      where l.proveedor.id in :ids and l.cantidadActual > 0
      group by l.proveedor.id
      """)
  List<LotesConStock> contarLotesConStock(Collection<Long> ids);
}
