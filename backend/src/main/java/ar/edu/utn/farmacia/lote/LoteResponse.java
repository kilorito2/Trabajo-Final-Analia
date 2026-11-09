package ar.edu.utn.farmacia.lote;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record LoteResponse(
    @NotNull Long id,
    @NotNull Long medicamentoId,
    @NotNull String medicamento,
    @NotNull Long proveedorId,
    @NotNull String proveedor,
    @NotNull String numeroLote,
    @NotNull LocalDate fechaVencimiento,
    int cantidadInicial,
    int cantidadActual,
    @NotNull LocalDate fechaIngreso,
    @NotNull EstadoLote estado,
    long diasParaVencer) {

  public static LoteResponse desde(Lote lote, LocalDate hoy, int diasPorVencer) {
    return new LoteResponse(
        lote.getId(),
        lote.getMedicamento().getId(),
        lote.getMedicamento().descripcion(),
        lote.getProveedor().getId(),
        lote.getProveedor().getRazonSocial(),
        lote.getNumeroLote(),
        lote.getFechaVencimiento(),
        lote.getCantidadInicial(),
        lote.getCantidadActual(),
        lote.getFechaIngreso(),
        lote.estado(hoy, diasPorVencer),
        ChronoUnit.DAYS.between(hoy, lote.getFechaVencimiento()));
  }
}
