package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.usuario.Usuario;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Envío simulado: deja constancia en el log de que se mandó un código, sin el código. La consigna
 * acepta una recuperación simulada y los usuarios no tienen correo cargado.
 */
@Component
class CorreoSimulado implements NotificadorRecuperacion {

  private static final Logger log = LoggerFactory.getLogger(CorreoSimulado.class);

  @Override
  public void enviarCodigo(Usuario usuario, String codigo, Duration vigencia) {
    log.info(
        "Correo simulado: código de recuperación enviado al usuario {} (vence en {} minutos)",
        usuario.getId(),
        vigencia.toMinutes());
  }
}
