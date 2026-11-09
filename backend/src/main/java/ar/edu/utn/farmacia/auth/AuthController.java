package ar.edu.utn.farmacia.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest pedido) {
    return authService.login(pedido);
  }

  @GetMapping("/me")
  public UsuarioSesion me() {
    return authService.sesionActual();
  }

  @PatchMapping("/me/password")
  public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambioPasswordRequest pedido) {
    authService.cambiarPassword(pedido);
    return ResponseEntity.noContent().build();
  }
}
