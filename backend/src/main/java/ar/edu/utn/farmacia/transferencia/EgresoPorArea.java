package ar.edu.utn.farmacia.transferencia;

import jakarta.validation.constraints.NotNull;

public record EgresoPorArea(@NotNull Long areaId, @NotNull String area, @NotNull Long unidades) {}
