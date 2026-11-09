package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.auth.Rol;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UsuarioRepository
    extends JpaRepository<Usuario, Long>, JpaSpecificationExecutor<Usuario> {

  Optional<Usuario> findByUsername(String username);

  boolean existsByUsername(String username);

  boolean existsByRol(Rol rol);

  long countByRolAndActivoTrue(Rol rol);
}
