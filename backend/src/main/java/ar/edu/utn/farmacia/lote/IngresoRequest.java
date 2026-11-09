package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

// fechaVencimiento >= hoy se valida en el servicio con el Clock: @FutureOrPresent usaría el reloj
// del sistema (UTC en el contenedor) y no el de Argentina.
public record IngresoRequest(
    @NotNull(message = "Elegí el proveedor.") Long proveedorId,
    @NotBlank(message = "Ingresá el número de lote.")
        @Size(max = 50, message = "El número de lote admite hasta 50 caracteres.")
        String numeroLote,
    @NotNull(message = "Ingresá la fecha de vencimiento.") LocalDate fechaVencimiento,
    @NotNull(message = "Ingresá la cantidad.")
        @Positive(message = "La cantidad tiene que ser mayor a 0.")
        Integer cantidad) {

  public IngresoRequest {
    numeroLote = Textos.limpiar(numeroLote);
  }
}
