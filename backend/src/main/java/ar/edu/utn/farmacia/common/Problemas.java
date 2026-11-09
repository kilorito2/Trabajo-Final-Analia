package ar.edu.utn.farmacia.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

public final class Problemas {

  public static final String CODIGO = "codigo";

  private Problemas() {}

  public static ProblemDetail crear(
      HttpStatus status, String titulo, String detalle, String codigo) {
    ProblemDetail problema = ProblemDetail.forStatusAndDetail(status, detalle);
    problema.setTitle(titulo);
    problema.setProperty(CODIGO, codigo);
    return problema;
  }

  public static ProblemDetail noAutenticado() {
    return crear(
        HttpStatus.UNAUTHORIZED,
        "No autenticado",
        "Necesitás iniciar sesión para acceder a este recurso.",
        "NO_AUTENTICADO");
  }

  public static ProblemDetail sinPermiso() {
    return crear(
        HttpStatus.FORBIDDEN,
        "Sin permiso",
        "Tu usuario no tiene permiso para realizar esta acción.",
        "SIN_PERMISO");
  }
}
