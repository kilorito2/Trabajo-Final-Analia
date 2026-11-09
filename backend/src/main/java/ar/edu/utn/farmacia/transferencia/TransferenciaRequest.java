package ar.edu.utn.farmacia.transferencia;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

/** No tiene ningún campo de usuario: quien transfiere sale del token. */
public record TransferenciaRequest(
    @NotNull(message = "Elegí el área de destino.") Long areaId,
    @Size(max = 500, message = "Las observaciones admiten hasta 500 caracteres.")
        String observaciones,
    @NotEmpty(message = "Agregá al menos un medicamento.")
        @Size(max = 50, message = "Se pueden transferir hasta 50 ítems por vez.")
        List<@Valid @NotNull(message = "El ítem no puede estar vacío.") Item> items) {

  public TransferenciaRequest {
    observaciones = Textos.limpiarOpcional(observaciones);
  }

  public record Item(
      @NotNull(message = "Elegí el medicamento.") Long medicamentoId,
      @NotNull(message = "Ingresá la cantidad.")
          @Positive(message = "La cantidad tiene que ser mayor a 0.")
          Integer cantidad) {}
}
