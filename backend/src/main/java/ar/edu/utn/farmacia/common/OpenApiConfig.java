package ar.edu.utn.farmacia.common;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class OpenApiConfig {

  private static final String ESQUEMA = "bearer";

  @Bean
  OpenAPI farmaciaOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Farmacia Hospitalaria")
                .version("1.0")
                .description("Control de stock de la farmacia de un hospital público."))
        .components(
            new Components()
                .addSecuritySchemes(
                    ESQUEMA,
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
        .addSecurityItem(new SecurityRequirement().addList(ESQUEMA));
  }
}
