package ar.edu.utn.farmacia.common;

import jakarta.validation.constraints.NotNull;

public record EstadoRequest(
    @NotNull(message = "Indicá si queda activo o inactivo.") Boolean activo) {}
