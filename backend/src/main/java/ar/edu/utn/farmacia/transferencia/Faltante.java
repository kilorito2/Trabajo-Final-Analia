package ar.edu.utn.farmacia.transferencia;

public record Faltante(Long medicamentoId, String medicamento, long disponible, int solicitado) {

  String mensaje() {
    return "Stock insuficiente de "
        + medicamento
        + ": disponible "
        + disponible
        + ", solicitado "
        + solicitado
        + ".";
  }
}
