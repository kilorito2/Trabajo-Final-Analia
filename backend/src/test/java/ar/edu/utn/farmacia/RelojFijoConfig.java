package ar.edu.utn.farmacia;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration(proxyBeanMethods = false)
public class RelojFijoConfig {

  public static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
  public static final LocalDate HOY = LocalDate.of(2026, 11, 9);

  public static Clock reloj() {
    return Clock.fixed(HOY.atTime(12, 0).atZone(ZONA).toInstant(), ZONA);
  }

  @Bean
  @Primary
  Clock relojFijo() {
    return reloj();
  }
}
