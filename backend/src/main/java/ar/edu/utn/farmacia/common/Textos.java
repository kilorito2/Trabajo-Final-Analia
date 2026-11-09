package ar.edu.utn.farmacia.common;

public final class Textos {

  private Textos() {}

  public static String limpiar(String texto) {
    return texto == null ? null : texto.strip();
  }

  /** Igual que {@link #limpiar(String)}, pero un texto vacío pasa a ser null. */
  public static String limpiarOpcional(String texto) {
    String limpio = limpiar(texto);
    return limpio == null || limpio.isEmpty() ? null : limpio;
  }
}
