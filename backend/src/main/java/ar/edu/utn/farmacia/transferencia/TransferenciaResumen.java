package ar.edu.utn.farmacia.transferencia;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record TransferenciaResumen(
    @NotNull Long id,
    @NotNull String numero,
    @NotNull OffsetDateTime fechaHora,
    @NotNull String area,
    @NotNull String realizadaPor,
    long cantidadItems,
    long unidadesTotales) {

  static TransferenciaResumen desde(Transferencia transferencia, TotalesTransferencia totales) {
    return new TransferenciaResumen(
        transferencia.getId(),
        Transferencia.numero(transferencia.getId()),
        transferencia.getFechaHora(),
        transferencia.getArea().getNombre(),
        transferencia.getRealizadaPor().getNombreCompleto(),
        totales == null ? 0 : totales.items(),
        totales == null ? 0 : totales.unidades());
  }
}
