package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotNull;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("farmacia.jwt")
public record JwtProperties(String secret, @DefaultValue("8h") @NotNull Duration duracion) {

  public static final int BYTES_MINIMOS = 32;
  public static final String EMISOR = "farmacia-hospitalaria";

  // El mensaje nunca incluye el valor de la clave.
  public JwtProperties {
    if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < BYTES_MINIMOS) {
      throw new IllegalArgumentException(
          "Falta JWT_SECRET (farmacia.jwt.secret) o tiene menos de "
              + BYTES_MINIMOS
              + " bytes. Generá una con: openssl rand -base64 48");
    }
  }
}
