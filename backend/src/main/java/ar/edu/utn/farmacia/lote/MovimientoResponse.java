package ar.edu.utn.farmacia.lote;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record MovimientoResponse(
    @NotNull Long id,
    @NotNull OffsetDateTime fechaHora,
    @NotNull TipoMovimiento tipo,
    int cantidad,
    int saldoResultante,
    @NotNull Long loteId,
    @NotNull String numeroLote,
    @NotNull String medicamento,
    @NotNull String usuario,
    Long transferenciaId,
    String motivo) {

  public static MovimientoResponse desde(MovimientoStock movimiento) {
    Lote lote = movimiento.getLote();
    return new MovimientoResponse(
        movimiento.getId(),
        movimiento.getFechaHora(),
        movimiento.getTipo(),
        movimiento.getCantidad(),
        movimiento.getSaldoResultante(),
        lote.getId(),
        lote.getNumeroLote(),
        lote.getMedicamento().descripcion(),
        movimiento.getUsuario().getUsername(),
        movimiento.getTransferencia() == null ? null : movimiento.getTransferencia().getId(),
        movimiento.getMotivo());
  }
}
