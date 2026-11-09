package ar.edu.utn.farmacia.medicamento;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.Locale;

public record MedicamentoRequest(
    @NotBlank(message = "Ingresá el código.")
        @Size(max = 30, message = "El código admite hasta 30 caracteres.")
        String codigo,
    @NotBlank(message = "Ingresá el nombre.")
        @Size(max = 120, message = "El nombre admite hasta 120 caracteres.")
        String nombre,
    @NotBlank(message = "Ingresá la presentación.")
        @Size(max = 120, message = "La presentación admite hasta 120 caracteres.")
        String presentacion,
    @NotNull(message = "Ingresá el stock mínimo.")
        @PositiveOrZero(message = "El stock mínimo no puede ser negativo.")
        Integer stockMinimo) {

  public MedicamentoRequest {
    codigo = codigo == null ? null : codigo.strip().toUpperCase(Locale.ROOT);
    nombre = Textos.limpiar(nombre);
    presentacion = Textos.limpiar(presentacion);
  }
}
