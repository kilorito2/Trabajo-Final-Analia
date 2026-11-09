package ar.edu.utn.farmacia.common;

import lombok.Getter;

/** Error de validación que solo se puede detectar en el servicio (por ejemplo, con el Clock). */
@Getter
public class ErrorDeCampoException extends RuntimeException {

  private final String campo;

  public ErrorDeCampoException(String campo, String mensaje) {
    super(mensaje);
    this.campo = campo;
  }
}
