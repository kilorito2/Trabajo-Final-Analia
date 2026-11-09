package ar.edu.utn.farmacia.area;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaRequest(
    @NotBlank(message = "Ingresá el nombre del área.")
        @Size(max = 80, message = "El nombre admite hasta 80 caracteres.")
        String nombre) {

  public AreaRequest {
    nombre = Textos.limpiar(nombre);
  }
}
