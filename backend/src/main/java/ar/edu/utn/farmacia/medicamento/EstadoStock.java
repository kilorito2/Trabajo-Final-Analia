package ar.edu.utn.farmacia.medicamento;

public enum EstadoStock {
  SIN_STOCK,
  STOCK_BAJO,
  OK;

  /** Las mismas reglas que las alertas: 0 es SIN_STOCK, hasta el mínimo inclusive es STOCK_BAJO. */
  public static EstadoStock de(long stockTotal, int stockMinimo) {
    if (stockTotal == 0) {
      return SIN_STOCK;
    }
    return stockTotal <= stockMinimo ? STOCK_BAJO : OK;
  }
}
