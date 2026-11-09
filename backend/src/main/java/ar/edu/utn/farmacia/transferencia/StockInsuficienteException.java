package ar.edu.utn.farmacia.transferencia;

import java.util.List;
import java.util.stream.Collectors;

public class StockInsuficienteException extends RuntimeException {

  private final List<Faltante> faltantes;

  public StockInsuficienteException(List<Faltante> faltantes) {
    super(faltantes.stream().map(Faltante::mensaje).collect(Collectors.joining(" ")));
    this.faltantes = List.copyOf(faltantes);
  }

  public List<Faltante> getFaltantes() {
    return faltantes;
  }
}
