package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.common.ErrorDeCampoException;
import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Recuperación de contraseña sin iniciar sesión, con un código de 6 números de un solo uso. */
@Service
@RequiredArgsConstructor
public class RecuperacionService {

  static final String MENSAJE_SOLICITUD =
      "Si el usuario existe y está activo, le enviamos un código para crear una contraseña nueva.";
  static final String CODIGO_INVALIDO = "El código no es válido o ya venció. Pedí uno nuevo.";
  static final String SIN_INTENTOS = "Superaste la cantidad de intentos. Pedí un código nuevo.";

  private static final Logger log = LoggerFactory.getLogger(RecuperacionService.class);
  private static final SecureRandom AZAR = new SecureRandom();

  private final UsuarioRepository usuarioRepository;
  private final RecuperacionPasswordRepository recuperacionRepository;
  private final NotificadorRecuperacion notificador;
  private final PasswordEncoder passwordEncoder;
  private final RecuperacionProperties propiedades;
  private final Clock clock;

  /**
   * La respuesta es la misma exista o no el usuario, para no revelar qué usuarios hay. El hash se
   * calcula siempre, así el tiempo de respuesta tampoco lo revela.
   */
  @Transactional
  public SolicitudRecuperacionResponse solicitar(SolicitudRecuperacionRequest pedido) {
    OffsetDateTime ahora = OffsetDateTime.now(clock);
    String codigo = generarCodigo();
    String codigoHash = passwordEncoder.encode(codigo);
    Optional<Usuario> usuario = buscarActivo(pedido.username());
    if (usuario.isEmpty()) {
      return new SolicitudRecuperacionResponse(MENSAJE_SOLICITUD, null);
    }
    recuperacionRepository.cerrarAbiertas(usuario.get().getId(), ahora);
    recuperacionRepository.save(
        new RecuperacionPassword(
            usuario.get(), codigoHash, ahora, ahora.plus(propiedades.vigencia())));
    notificador.enviarCodigo(usuario.get(), codigo, propiedades.vigencia());
    return new SolicitudRecuperacionResponse(
        MENSAJE_SOLICITUD, propiedades.mostrarCodigo() ? codigo : null);
  }

  // noRollbackFor: el intento fallido tiene que quedar contado aunque se responda con error.
  @Transactional(noRollbackFor = ErrorDeCampoException.class)
  public void confirmar(ConfirmacionRecuperacionRequest pedido) {
    OffsetDateTime ahora = OffsetDateTime.now(clock);
    Usuario usuario =
        buscarActivo(pedido.username()).orElseThrow(() -> errorCodigo(CODIGO_INVALIDO));
    RecuperacionPassword recuperacion =
        recuperacionRepository
            .bloquearAbierta(usuario.getId())
            .filter(abierta -> abierta.estaVigente(ahora))
            .orElseThrow(() -> errorCodigo(CODIGO_INVALIDO));
    if (!recuperacion.registrarIntento(propiedades.intentosMaximos(), ahora)) {
      throw errorCodigo(SIN_INTENTOS);
    }
    if (!passwordEncoder.matches(pedido.codigo(), recuperacion.getCodigoHash())) {
      throw errorCodigo(CODIGO_INVALIDO);
    }
    usuario.setPasswordHash(passwordEncoder.encode(pedido.passwordNueva()));
    recuperacion.cerrar(ahora);
    log.info("Contraseña recuperada por el usuario {}", usuario.getId());
  }

  private Optional<Usuario> buscarActivo(String username) {
    return usuarioRepository
        .findByUsername(Usuario.normalizarUsername(username))
        .filter(Usuario::isActivo);
  }

  private static String generarCodigo() {
    return String.format("%06d", AZAR.nextInt(1_000_000));
  }

  private static ErrorDeCampoException errorCodigo(String mensaje) {
    return new ErrorDeCampoException("codigo", mensaje);
  }
}
