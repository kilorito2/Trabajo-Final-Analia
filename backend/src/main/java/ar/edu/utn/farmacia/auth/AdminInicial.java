package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.common.FarmaciaProperties;
import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Crea el primer ADMIN si no hay ninguno. Si ya existe, ADMIN_PASSWORD se ignora. */
@Component
@Order(1)
@RequiredArgsConstructor
public class AdminInicial implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);
  private static final int LARGO_MINIMO = 8;

  private final UsuarioRepository usuarioRepository;
  private final PasswordEncoder passwordEncoder;
  private final FarmaciaProperties propiedades;
  private final Clock clock;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (usuarioRepository.existsByRol(Rol.ADMIN)) {
      return;
    }
    String password = propiedades.admin().password();
    if (password == null || password.length() < LARGO_MINIMO) {
      throw new IllegalStateException(
          "No hay ningún ADMIN y falta ADMIN_PASSWORD (mínimo "
              + LARGO_MINIMO
              + " caracteres) para crear el usuario admin.");
    }
    usuarioRepository.save(
        new Usuario(
            "admin",
            "Administrador",
            passwordEncoder.encode(password),
            Rol.ADMIN,
            OffsetDateTime.now(clock)));
    log.info("Se creó el usuario admin inicial");
  }
}
