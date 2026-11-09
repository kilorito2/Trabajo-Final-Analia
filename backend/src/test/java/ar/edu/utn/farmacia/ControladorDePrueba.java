package ar.edu.utn.farmacia;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Solo existe en los tests, para provocar un error inesperado y revisar el 500. */
@RestController
class ControladorDePrueba {

  @GetMapping("/api/prueba/error")
  String fallar() {
    throw new IllegalStateException("detalle interno que no tiene que llegar al cliente");
  }
}
