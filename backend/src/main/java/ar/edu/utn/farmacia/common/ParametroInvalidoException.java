package ar.edu.utn.farmacia.common;

import lombok.Getter;

@Getter
public class ParametroInvalidoException extends RuntimeException {

  private final String codigo;

  public ParametroInvalidoException(String codigo, String mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}
