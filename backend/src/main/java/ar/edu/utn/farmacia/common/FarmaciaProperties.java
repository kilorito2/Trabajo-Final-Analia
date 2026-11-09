package ar.edu.utn.farmacia.common;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("farmacia")
public record FarmaciaProperties(
    @DefaultValue("America/Argentina/Buenos_Aires") @NotBlank String zonaHoraria,
    @DefaultValue @Valid Alertas alertas,
    @DefaultValue Cors cors,
    @DefaultValue Admin admin,
    @DefaultValue Demo demo) {

  public record Alertas(@DefaultValue("30") @PositiveOrZero int diasPorVencer) {}

  public record Cors(@DefaultValue List<String> origenes) {}

  public record Admin(String password) {}

  public record Demo(@DefaultValue("demo1234") String password) {}
}
