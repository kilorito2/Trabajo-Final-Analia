package ar.edu.utn.farmacia.auth;

public class CredencialesInvalidasException extends RuntimeException {

  public CredencialesInvalidasException() {
    super("Usuario o contraseña incorrectos.");
  }
}
