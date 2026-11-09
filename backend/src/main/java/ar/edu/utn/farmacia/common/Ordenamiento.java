package ar.edu.utn.farmacia.common;

import java.util.Set;
import org.springframework.data.domain.Sort;

/** Lista blanca de campos de orden: evita, por ejemplo, ordenar usuarios por passwordHash. */
public final class Ordenamiento {

  private Ordenamiento() {}

  public static void validar(Sort orden, Set<String> permitidos) {
    for (Sort.Order criterio : orden) {
      if (!permitidos.contains(criterio.getProperty())) {
        throw new ParametroInvalidoException(
            "ORDEN_INVALIDO",
            "No se puede ordenar por '"
                + criterio.getProperty()
                + "'. Campos permitidos: "
                + String.join(", ", permitidos.stream().sorted().toList())
                + ".");
      }
    }
  }
}
