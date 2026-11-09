package ar.edu.utn.farmacia.auth;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record LoginResponse(
    @NotNull String token, @NotNull Instant expiraEn, @NotNull UsuarioSesion usuario) {}
