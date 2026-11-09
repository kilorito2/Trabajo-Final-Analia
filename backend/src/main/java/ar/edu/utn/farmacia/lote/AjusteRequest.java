package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AjusteRequest(
    @NotNull(message = "Ingresá la cantidad nueva.")
        @PositiveOrZero(message = "La cantidad no puede ser negativa.")
        Integer cantidadNueva,
    @NotBlank(message = "Indicá el motivo del ajuste.")
        @Size(min = 5, max = 200, message = "El motivo debe tener entre 5 y 200 caracteres.")
        String motivo) {

  public AjusteRequest {
    motivo = Textos.limpiar(motivo);
  }
}
