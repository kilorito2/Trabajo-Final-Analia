package ar.edu.utn.farmacia.common;

import java.util.List;
import java.util.stream.Collectors;

/** CSV para Excel en español: separador ";" y fin de línea "\r\n". */
public final class Csv {

  public static final String SEPARADOR = ";";
  public static final String FIN_DE_LINEA = "\r\n";
  public static final String BOM = "﻿";

  private Csv() {}

  public static String linea(List<String> valores) {
    return valores.stream().map(Csv::celda).collect(Collectors.joining(SEPARADOR)) + FIN_DE_LINEA;
  }

  // Excel ejecuta como fórmula cualquier celda que empiece con =, +, -, @, tabulación o retorno de
  // carro (inyección de fórmulas). Anteponer una comilla simple hace que se muestre como texto.
  static String celda(String valor) {
    if (valor == null || valor.isEmpty()) {
      return "";
    }
    String seguro = esPeligroso(valor.charAt(0)) ? "'" + valor : valor;
    if (seguro.contains(SEPARADOR)
        || seguro.contains("\"")
        || seguro.contains("\n")
        || seguro.contains("\r")) {
      return "\"" + seguro.replace("\"", "\"\"") + "\"";
    }
    return seguro;
  }

  private static boolean esPeligroso(char inicial) {
    return inicial == '='
        || inicial == '+'
        || inicial == '-'
        || inicial == '@'
        || inicial == '\t'
        || inicial == '\r';
  }
}
