package ar.edu.utn.farmacia.transferencia;

import static ar.edu.utn.farmacia.common.Exportador.FECHA;
import static ar.edu.utn.farmacia.common.Exportador.FECHA_HORA;
import static ar.edu.utn.farmacia.common.ReportePdf.TEXTO;
import static ar.edu.utn.farmacia.common.ReportePdf.TEXTO_SUAVE;
import static ar.edu.utn.farmacia.common.ReportePdf.fuente;
import static ar.edu.utn.farmacia.common.ReportePdf.fuenteNegrita;

import ar.edu.utn.farmacia.common.Reporte.Columna;
import ar.edu.utn.farmacia.common.ReportePdf;
import com.lowagie.text.Element;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

/** El mismo comprobante que se imprime desde la pantalla, con lugar para las dos firmas. */
final class ComprobantePdf {

  private static final List<Columna> COLUMNAS =
      List.of(
          Columna.texto("Medicamento", 46),
          Columna.texto("Lote", 16),
          Columna.texto("Vencimiento", 18),
          Columna.numero("Cantidad", 14));

  private ComprobantePdf() {}

  static byte[] generar(TransferenciaResponse transferencia, ZoneId zona, String generadoEn) {
    int unidades =
        transferencia.detalle().stream().mapToInt(TransferenciaResponse.Linea::cantidad).sum();
    List<List<String>> filas =
        transferencia.detalle().stream()
            .map(
                linea ->
                    List.of(
                        linea.medicamento(),
                        linea.numeroLote(),
                        linea.fechaVencimiento().format(FECHA),
                        String.valueOf(linea.cantidad())))
            .toList();
    String fechaHora = transferencia.fechaHora().atZoneSameInstant(zona).format(FECHA_HORA);
    return ReportePdf.documento(
        "Comprobante de transferencia " + transferencia.numero(),
        generadoEn,
        false,
        documento -> {
          PdfPTable datos = new PdfPTable(4);
          datos.setWidthPercentage(100);
          datos.setSpacingAfter(14);
          dato(datos, "Fecha y hora", fechaHora);
          dato(datos, "Área de destino", transferencia.area().nombre());
          dato(datos, "Entregó", transferencia.realizadaPor().nombreCompleto());
          dato(datos, "Unidades", String.valueOf(unidades));
          documento.add(datos);
          String observaciones = transferencia.observaciones();
          if (observaciones != null && !observaciones.isBlank()) {
            Paragraph parrafo = new Paragraph("Observaciones: " + observaciones, fuente(9, TEXTO));
            parrafo.setSpacingAfter(12);
            documento.add(parrafo);
          }
          documento.add(ReportePdf.tabla(COLUMNAS, filas));
          documento.add(firmas(transferencia.area().nombre()));
        });
  }

  private static void dato(PdfPTable tabla, String etiqueta, String valor) {
    PdfPCell celda = new PdfPCell();
    celda.setBorder(Rectangle.NO_BORDER);
    celda.addElement(
        new Paragraph(etiqueta.toUpperCase(Locale.ROOT), fuenteNegrita(7, TEXTO_SUAVE)));
    celda.addElement(new Paragraph(valor, fuenteNegrita(10, TEXTO)));
    tabla.addCell(celda);
  }

  private static PdfPTable firmas(String area) {
    PdfPTable firmas = new PdfPTable(new float[] {1, 0.2f, 1});
    firmas.setWidthPercentage(100);
    firmas.setSpacingBefore(70);
    firmas.addCell(firma("Entrega (farmacia): firma y aclaración"));
    PdfPCell separador = new PdfPCell();
    separador.setBorder(Rectangle.NO_BORDER);
    firmas.addCell(separador);
    firmas.addCell(firma("Recibe (" + area + "): firma y aclaración"));
    return firmas;
  }

  private static PdfPCell firma(String texto) {
    PdfPCell celda = new PdfPCell(new Phrase(texto, fuente(8, TEXTO_SUAVE)));
    celda.setBorder(Rectangle.TOP);
    celda.setBorderColor(TEXTO);
    celda.setHorizontalAlignment(Element.ALIGN_CENTER);
    celda.setPaddingTop(6);
    return celda;
  }
}
