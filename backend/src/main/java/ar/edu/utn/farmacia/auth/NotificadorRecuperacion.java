package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.usuario.Usuario;
import java.time.Duration;

/** Cómo le llega el código al usuario. Hoy es simulado; un envío por correo real lo reemplaza. */
public interface NotificadorRecuperacion {

  void enviarCodigo(Usuario usuario, String codigo, Duration vigencia);
}
