package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotNull;

/**
 * @param codigoSimulado solo viene con {@code farmacia.recuperacion.mostrar-codigo} activo y si el
 *     usuario existe; reemplaza al correo en la simulación
 */
public record SolicitudRecuperacionResponse(@NotNull String mensaje, String codigoSimulado) {}
