package ar.edu.utn.farmacia.alerta;

import ar.edu.utn.farmacia.medicamento.MedicamentoConStock;
import jakarta.validation.constraints.NotNull;

public record AlertaMedicamento(
    @NotNull Long medicamentoId,
    @NotNull String codigo,
    @NotNull String nombre,
    @NotNull String presentacion,
    long stockTotal,
    int stockMinimo) {

  static AlertaMedicamento desde(MedicamentoConStock medicamento) {
    return new AlertaMedicamento(
        medicamento.id(),
        medicamento.codigo(),
        medicamento.nombre(),
        medicamento.presentacion(),
        medicamento.stockTotal(),
        medicamento.stockMinimo());
  }
}
