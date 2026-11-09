package ar.edu.utn.farmacia.medicamento;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record MedicamentoResponse(
    @NotNull Long id,
    @NotNull String codigo,
    @NotNull String nombre,
    @NotNull String presentacion,
    int stockMinimo,
    long stockTotal,
    @NotNull EstadoStock estadoStock,
    LocalDate proximoVencimiento,
    boolean activo) {

  public static MedicamentoResponse desde(MedicamentoConStock fila) {
    return new MedicamentoResponse(
        fila.id(),
        fila.codigo(),
        fila.nombre(),
        fila.presentacion(),
        fila.stockMinimo(),
        fila.stockTotal(),
        fila.estado(),
        fila.proximoVencimiento(),
        fila.activo());
  }

  public static MedicamentoResponse desde(
      Medicamento medicamento, long stockTotal, LocalDate proximoVencimiento) {
    return new MedicamentoResponse(
        medicamento.getId(),
        medicamento.getCodigo(),
        medicamento.getNombre(),
        medicamento.getPresentacion(),
        medicamento.getStockMinimo(),
        stockTotal,
        EstadoStock.de(stockTotal, medicamento.getStockMinimo()),
        proximoVencimiento,
        medicamento.isActivo());
  }
}
