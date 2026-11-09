package ar.edu.utn.farmacia;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.utn.farmacia.auth.JwtProperties;
import ar.edu.utn.farmacia.demo.PerfilesIncompatibles;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

class ConfiguracionTest {

  private static final String CLAVE_CORTA = "clave-corta-de-31-bytes-1234567";

  private final ApplicationContextRunner conJwt =
      new ApplicationContextRunner().withUserConfiguration(ConfiguracionJwt.class);

  @Test
  void noArrancaSinJwtSecret() {
    conJwt.run(
        contexto -> {
          assertThat(contexto).hasFailed();
          assertThat(contexto.getStartupFailure()).rootCause().hasMessageContaining("JWT_SECRET");
        });
  }

  @Test
  void noArrancaConUnaClaveDeMenosDe32BytesYNoLaImprime() {
    assertThat(CLAVE_CORTA).hasSize(31);
    conJwt
        .withPropertyValues("farmacia.jwt.secret=" + CLAVE_CORTA)
        .run(
            contexto -> {
              assertThat(contexto).hasFailed();
              assertThat(contexto.getStartupFailure())
                  .rootCause()
                  .hasMessageContaining("32 bytes")
                  .hasMessageNotContaining(CLAVE_CORTA);
            });
  }

  @Test
  void arrancaConUnaClaveDe32BytesOMas() {
    conJwt
        .withPropertyValues("farmacia.jwt.secret=" + CLAVE_CORTA + "8")
        .run(contexto -> assertThat(contexto).hasNotFailed().hasSingleBean(JwtProperties.class));
  }

  @Test
  void noArrancaConDemoYProdALaVez() {
    new ApplicationContextRunner()
        .withPropertyValues("spring.profiles.active=demo,prod")
        .withUserConfiguration(PerfilesIncompatibles.class)
        .run(
            contexto -> {
              assertThat(contexto).hasFailed();
              assertThat(contexto.getStartupFailure())
                  .rootCause()
                  .hasMessageContaining("'demo' y 'prod'");
            });
  }

  @Test
  void arrancaSoloConDemo() {
    new ApplicationContextRunner()
        .withPropertyValues("spring.profiles.active=demo")
        .withUserConfiguration(PerfilesIncompatibles.class)
        .run(contexto -> assertThat(contexto).hasNotFailed());
  }

  @Configuration(proxyBeanMethods = false)
  @EnableConfigurationProperties(JwtProperties.class)
  static class ConfiguracionJwt {}
}
