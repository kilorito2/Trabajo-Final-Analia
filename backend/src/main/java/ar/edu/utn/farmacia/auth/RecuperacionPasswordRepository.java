package ar.edu.utn.farmacia.auth;

import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface RecuperacionPasswordRepository extends JpaRepository<RecuperacionPassword, Long> {

  // Con bloqueo: dos intentos simultáneos no pueden saltearse el contador de intentos.
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
      select r from RecuperacionPassword r
      where r.usuario.id = :usuarioId and r.cerradaEn is null
      order by r.creadaEn desc, r.id desc
      limit 1
      """)
  Optional<RecuperacionPassword> bloquearAbierta(Long usuarioId);

  /** Al pedir un código nuevo, los anteriores dejan de servir. */
  @Modifying
  @Query(
      """
      update RecuperacionPassword r set r.cerradaEn = :ahora
      where r.usuario.id = :usuarioId and r.cerradaEn is null
      """)
  int cerrarAbiertas(Long usuarioId, OffsetDateTime ahora);
}
