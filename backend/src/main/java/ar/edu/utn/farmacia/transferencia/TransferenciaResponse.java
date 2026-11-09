package ar.edu.utn.farmacia.transferencia;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Comprobante completo de la transferencia. */
public record TransferenciaResponse(
    @NotNull Long id,
    @NotNull String numero,
    @NotNull OffsetDateTime fechaHora,
    @NotNull AreaResumen area,
    @NotNull UsuarioResumen realizadaPor,
    String observaciones,
    @NotNull List<Linea> detalle) {

  public static TransferenciaResponse desde(Transferencia transferencia) {
    return new TransferenciaResponse(
        transferencia.getId(),
        Transferencia.numero(transferencia.getId()),
        transferencia.getFechaHora(),
        new AreaResumen(transferencia.getArea().getId(), transferencia.getArea().getNombre()),
        new UsuarioResumen(
            transferencia.getRealizadaPor().getId(),
            transferencia.getRealizadaPor().getNombreCompleto()),
        transferencia.getObservaciones(),
        transferencia.getDetalle().stream().map(Linea::desde).toList());
  }

  public record AreaResumen(@NotNull Long id, @NotNull String nombre) {}

  public record UsuarioResumen(@NotNull Long id, @NotNull String nombreCompleto) {}

  public record Linea(
      @NotNull Long medicamentoId,
      @NotNull String medicamento,
      @NotNull Long loteId,
      @NotNull String numeroLote,
      @NotNull LocalDate fechaVencimiento,
      int cantidad) {

    static Linea desde(DetalleTransferencia linea) {
      var lote = linea.getLote();
      return new Linea(
          lote.getMedicamento().getId(),
          lote.getMedicamento().descripcion(),
          lote.getId(),
          lote.getNumeroLote(),
          lote.getFechaVencimiento(),
          linea.getCantidad());
    }
  }
}
