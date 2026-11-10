package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * @param mostrarCodigo el envío del código es simulado: con true, la respuesta lo incluye para
 *     poder probar el flujo sin correo. Solo se activa en los perfiles demo y test.
 */
@Validated
@ConfigurationProperties("farmacia.recuperacion")
public record RecuperacionProperties(
    @DefaultValue("15m") @NotNull Duration vigencia,
    @DefaultValue("5") @Positive int intentosMaximos,
    @DefaultValue("false") boolean mostrarCodigo) {}
