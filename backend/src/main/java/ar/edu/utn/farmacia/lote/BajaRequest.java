package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BajaRequest(
    @NotBlank(message = "Indicá el motivo de la baja.")
        @Size(min = 5, max = 200, message = "El motivo debe tener entre 5 y 200 caracteres.")
        String motivo) {

  public BajaRequest {
    motivo = Textos.limpiar(motivo);
  }
}
