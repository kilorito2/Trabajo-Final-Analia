package ar.edu.utn.farmacia.common;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class RelojConfig {

  // El contenedor corre en UTC: sin la zona de Argentina, a partir de las 21:00 "hoy" ya sería
  // mañana y los lotes se verían vencidos tres horas antes de tiempo.
  @Bean
  Clock clock(FarmaciaProperties propiedades) {
    return Clock.system(ZoneId.of(propiedades.zonaHoraria()));
  }
}
