package ar.edu.utn.farmacia;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/** La misma imagen que docker-compose. Todos los tests de integración comparten el contexto. */
@TestConfiguration(proxyBeanMethods = false)
public class ContenedoresConfig {

  @Bean
  @ServiceConnection
  PostgreSQLContainer postgres() {
    return new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
  }
}
