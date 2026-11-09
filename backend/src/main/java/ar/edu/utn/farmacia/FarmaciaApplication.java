package ar.edu.utn.farmacia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FarmaciaApplication {

  public static void main(String[] args) {
    SpringApplication.run(FarmaciaApplication.class, args);
  }
}
