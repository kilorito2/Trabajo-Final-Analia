package ar.edu.utn.farmacia.demo;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** Los datos demo nunca se pueden cargar en producción: con los dos perfiles, la app no arranca. */
@Configuration(proxyBeanMethods = false)
@Profile("demo & prod")
public class PerfilesIncompatibles {

  public PerfilesIncompatibles() {
    throw new IllegalStateException(
        "Los perfiles 'demo' y 'prod' no pueden estar activos al mismo tiempo.");
  }
}
