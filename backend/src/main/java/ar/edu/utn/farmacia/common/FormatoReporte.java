package ar.edu.utn.farmacia.common;

import org.springframework.http.MediaType;

public enum FormatoReporte {
  CSV("text/csv;charset=UTF-8", "csv"),
  PDF("application/pdf", "pdf");

  private final MediaType tipo;
  private final String extension;

  FormatoReporte(String tipo, String extension) {
    this.tipo = MediaType.parseMediaType(tipo);
    this.extension = extension;
  }

  public MediaType tipo() {
    return tipo;
  }

  public String extension() {
    return extension;
  }
}
