package ar.edu.utn.farmacia.auth;

import ar.edu.utn.farmacia.common.Problemas;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * Escribe el 401 y el 403 de la cadena de seguridad con el mismo formato que el resto de la API.
 */
@Component
@RequiredArgsConstructor
public class ErroresSeguridad implements AuthenticationEntryPoint, AccessDeniedHandler {

  private final JsonMapper jsonMapper;

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {
    response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
    escribir(request, response, Problemas.noAutenticado());
  }

  @Override
  public void handle(
      HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException)
      throws IOException {
    escribir(request, response, Problemas.sinPermiso());
  }

  private void escribir(
      HttpServletRequest request, HttpServletResponse response, ProblemDetail problema)
      throws IOException {
    problema.setInstance(URI.create(request.getRequestURI()));
    response.setStatus(problema.getStatus());
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    jsonMapper.writeValue(response.getOutputStream(), problema);
  }
}
