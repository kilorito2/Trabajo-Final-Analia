package ar.edu.utn.farmacia.alerta;

import ar.edu.utn.farmacia.lote.Lote;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** diasParaVencer es negativo si el lote ya venció. */
public record AlertaLote(
    @NotNull Long loteId,
    @NotNull String numeroLote,
    @NotNull Long medicamentoId,
    @NotNull String medicamento,
    @NotNull LocalDate fechaVencimiento,
    long diasParaVencer,
    int cantidadActual) {

  static AlertaLote desde(Lote lote, LocalDate hoy) {
    return new AlertaLote(
        lote.getId(),
        lote.getNumeroLote(),
        lote.getMedicamento().getId(),
        lote.getMedicamento().descripcion(),
        lote.getFechaVencimiento(),
        ChronoUnit.DAYS.between(hoy, lote.getFechaVencimiento()),
        lote.getCantidadActual());
  }
}
