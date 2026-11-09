package ar.edu.utn.farmacia.common;

import lombok.Getter;

@Getter
public class ReglaNegocioException extends RuntimeException {

  private final String codigo;

  public ReglaNegocioException(String codigo, String mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}
