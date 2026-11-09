package ar.edu.utn.farmacia.proveedor;

public final class Cuits {

  private static final int[] PESOS = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};

  private Cuits() {}

  /** Saca guiones y espacios. No valida: eso lo hace {@link #esValido(String)}. */
  public static String normalizar(String cuit) {
    return cuit == null ? null : cuit.replace("-", "").replace(" ", "").strip();
  }

  public static boolean esValido(String cuit) {
    String digitos = normalizar(cuit);
    if (digitos == null || !digitos.matches("\\d{11}")) {
      return false;
    }
    int suma = 0;
    for (int i = 0; i < PESOS.length; i++) {
      suma += Character.getNumericValue(digitos.charAt(i)) * PESOS[i];
    }
    int verificador = 11 - (suma % 11);
    if (verificador == 11) {
      verificador = 0;
    }
    return verificador != 10 && verificador == Character.getNumericValue(digitos.charAt(10));
  }

  /** "20123456786" pasa a "20-12345678-6". */
  public static String formatear(String cuit) {
    return cuit.substring(0, 2) + "-" + cuit.substring(2, 10) + "-" + cuit.substring(10);
  }
}
