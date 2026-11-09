package ar.edu.utn.farmacia.common;

public class RecursoNoEncontradoException extends RuntimeException {

  public RecursoNoEncontradoException(String mensaje) {
    super(mensaje);
  }
}
