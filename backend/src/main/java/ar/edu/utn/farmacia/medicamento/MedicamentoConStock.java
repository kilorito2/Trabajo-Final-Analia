package ar.edu.utn.farmacia.medicamento;

import java.time.LocalDate;

/** Fila de las consultas de stock: el medicamento con su stock calculado sobre los lotes. */
public record MedicamentoConStock(
    Long id,
    String codigo,
    String nombre,
    String presentacion,
    int stockMinimo,
    boolean activo,
    long stockTotal,
    LocalDate proximoVencimiento) {

  public EstadoStock estado() {
    return EstadoStock.de(stockTotal, stockMinimo);
  }
}
