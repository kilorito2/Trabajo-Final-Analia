package ar.edu.utn.farmacia.proveedor;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CuitValidator implements ConstraintValidator<Cuit, String> {

  @Override
  public boolean isValid(String valor, ConstraintValidatorContext contexto) {
    return valor == null || Cuits.esValido(valor);
  }
}
