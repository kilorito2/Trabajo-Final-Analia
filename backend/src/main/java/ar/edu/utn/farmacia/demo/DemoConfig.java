package ar.edu.utn.farmacia.demo;

import ar.edu.utn.farmacia.common.FarmaciaProperties;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("demo")
class DemoConfig {

  @Bean
  @Primary
  RelojDemo relojDemo(FarmaciaProperties propiedades) {
    return new RelojDemo(ZoneId.of(propiedades.zonaHoraria()));
  }
}
