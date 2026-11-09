package ar.edu.utn.farmacia.medicamento;

import ar.edu.utn.farmacia.lote.LoteResponse;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/** MedicamentoResponse más sus lotes con stock, en orden FEFO. */
public record MedicamentoDetalleResponse(
    @NotNull Long id,
    @NotNull String codigo,
    @NotNull String nombre,
    @NotNull String presentacion,
    int stockMinimo,
    long stockTotal,
    @NotNull EstadoStock estadoStock,
    LocalDate proximoVencimiento,
    boolean activo,
    @NotNull List<LoteResponse> lotes) {

  public static MedicamentoDetalleResponse desde(
      MedicamentoResponse medicamento, List<LoteResponse> lotes) {
    return new MedicamentoDetalleResponse(
        medicamento.id(),
        medicamento.codigo(),
        medicamento.nombre(),
        medicamento.presentacion(),
        medicamento.stockMinimo(),
        medicamento.stockTotal(),
        medicamento.estadoStock(),
        medicamento.proximoVencimiento(),
        medicamento.activo(),
        lotes);
  }
}
