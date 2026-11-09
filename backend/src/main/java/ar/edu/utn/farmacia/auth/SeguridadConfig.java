package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.common.FarmaciaProperties;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
public class SeguridadConfig {

  private static final String[] RUTAS_SWAGGER = {
    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
  };

  // La API usa Bearer y no cookies, así que no hay sesión ni riesgo de CSRF (ver
  // docs/decisiones.md).
  @Bean
  SecurityFilterChain cadenaDeSeguridad(
      HttpSecurity http,
      UsuarioJwtConverter convertidor,
      ErroresSeguridad errores,
      @Value("${springdoc.api-docs.enabled:true}") boolean swaggerHabilitado)
      throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> {})
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            pedidos -> {
              pedidos.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll();
              pedidos.requestMatchers("/actuator/health").permitAll();
              if (swaggerHabilitado) {
                pedidos.requestMatchers(RUTAS_SWAGGER).permitAll();
              }
              pedidos.anyRequest().authenticated();
            })
        .oauth2ResourceServer(
            recurso ->
                recurso
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(convertidor))
                    .authenticationEntryPoint(errores)
                    .accessDeniedHandler(errores))
        .exceptionHandling(
            excepciones ->
                excepciones.authenticationEntryPoint(errores).accessDeniedHandler(errores));
    return http.build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  // DaoAuthenticationProvider ya compara con BCrypt y, si el usuario no existe, igual calcula un
  // hash para que el tiempo de respuesta no revele qué usuarios existen.
  @Bean
  AuthenticationManager authenticationManager(
      UsuarioDetailsService usuarioDetailsService, PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider proveedor = new DaoAuthenticationProvider(usuarioDetailsService);
    proveedor.setPasswordEncoder(passwordEncoder);
    return new ProviderManager(proveedor);
  }

  @Bean
  JwtEncoder jwtEncoder(JwtProperties propiedades) {
    return NimbusJwtEncoder.withSecretKey(clave(propiedades)).algorithm(MacAlgorithm.HS256).build();
  }

  @Bean
  JwtDecoder jwtDecoder(JwtProperties propiedades, Clock clock) {
    NimbusJwtDecoder decoder =
        NimbusJwtDecoder.withSecretKey(clave(propiedades)).macAlgorithm(MacAlgorithm.HS256).build();
    JwtTimestampValidator vencimiento = new JwtTimestampValidator();
    vencimiento.setClock(clock);
    decoder.setJwtValidator(
        new DelegatingOAuth2TokenValidator<>(
            vencimiento, new JwtIssuerValidator(JwtProperties.EMISOR)));
    return decoder;
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(FarmaciaProperties propiedades) {
    UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
    if (!propiedades.cors().origenes().isEmpty()) {
      CorsConfiguration cors = new CorsConfiguration();
      cors.setAllowedOrigins(propiedades.cors().origenes());
      cors.addAllowedMethod("*");
      cors.addAllowedHeader("*");
      cors.addExposedHeader("Content-Disposition");
      cors.addExposedHeader("Location");
      fuente.registerCorsConfiguration("/api/**", cors);
    }
    return fuente;
  }

  private static SecretKey clave(JwtProperties propiedades) {
    return new SecretKeySpec(propiedades.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
  }
}
