package ar.edu.utn.farmacia.proveedor;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** CUIT de 11 dígitos, con o sin guiones, con dígito verificador válido. Null se acepta. */
@Documented
@Constraint(validatedBy = CuitValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface Cuit {

  String message() default "El CUIT no es válido.";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
