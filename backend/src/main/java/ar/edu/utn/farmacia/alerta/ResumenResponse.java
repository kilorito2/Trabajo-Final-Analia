package ar.edu.utn.farmacia.alerta;

import ar.edu.utn.farmacia.transferencia.EgresoPorArea;
import ar.edu.utn.farmacia.transferencia.TransferenciaResumen;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ResumenResponse(
    @NotNull Totales totales,
    int diasPorVencer,
    long medicamentosActivos,
    long transferenciasHoy,
    @NotNull List<TransferenciaResumen> ultimasTransferencias,
    @NotNull List<EgresoPorArea> egresosPorArea) {

  public record Totales(int sinStock, int stockBajo, int vencidos, int porVencer) {}
}
