package ar.edu.utn.farmacia.lote;

import jakarta.validation.constraints.NotNull;

public record IngresoResponse(@NotNull LoteResponse lote, long stockTotalResultante) {}
