package ar.edu.utn.farmacia.alerta;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AlertasResponse(
    int diasPorVencer,
    @NotNull List<AlertaMedicamento> sinStock,
    @NotNull List<AlertaMedicamento> stockBajo,
    @NotNull List<AlertaLote> vencidos,
    @NotNull List<AlertaLote> porVencer) {}
