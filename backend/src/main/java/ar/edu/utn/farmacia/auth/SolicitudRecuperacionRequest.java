package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudRecuperacionRequest(
    @NotBlank(message = "Ingresá tu usuario.") @Size(max = 50) String username) {}
