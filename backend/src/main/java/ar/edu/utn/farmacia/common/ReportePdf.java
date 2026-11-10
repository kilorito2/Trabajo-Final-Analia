package ar.edu.utn.farmacia.common;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;

/**
 * PDF de los reportes con la identidad del sistema: encabezado con el nombre de la farmacia, tabla
 * con filas alternadas y pie con la fecha de generación y el número de página.
 */
public final class ReportePdf {

  public static final Color PRIMARIO = new Color(10, 97, 112);
  public static final Color TEXTO = new Color(20, 35, 46);
  public static final Color TEXTO_SUAVE = new Color(77, 93, 107);
  public static final Color BORDE = new Color(223, 230, 236);
  public static final Color FONDO_SUAVE = new Color(247, 249, 251);

  private static final String MARCA = "Farmacia Hospitalaria";

  private ReportePdf() {}

  /** Lo que cada documento agrega entre el encabezado y el pie. */
  @FunctionalInterface
  public interface Contenido {
    void agregar(Document documento) throws DocumentException;
  }

  public static byte[] generar(Reporte reporte, String generadoEn) {
    boolean apaisado = reporte.columnas().size() > 6;
    return documento(
        reporte.titulo(),
        generadoEn,
        apaisado,
        documento -> {
          if (!reporte.filtros().isEmpty()) {
            Paragraph filtros =
                new Paragraph(String.join("  ·  ", reporte.filtros()), fuente(9, TEXTO_SUAVE));
            filtros.setSpacingAfter(10);
            documento.add(filtros);
          }
          documento.add(tabla(reporte.columnas(), reporte.filas()));
          Paragraph total =
              new Paragraph("Total de filas: " + reporte.filas().size(), fuente(9, TEXTO_SUAVE));
          total.setSpacingBefore(8);
          documento.add(total);
        });
  }

  public static byte[] documento(
      String titulo, String generadoEn, boolean apaisado, Contenido contenido) {
    ByteArrayOutputStream salida = new ByteArrayOutputStream();
    Rectangle pagina = apaisado ? PageSize.A4.rotate() : PageSize.A4;
    Document documento = new Document(pagina, 40, 40, 48, 48);
    try {
      PdfWriter escritor = PdfWriter.getInstance(documento, salida);
      escritor.setPageEvent(new PiePagina(generadoEn));
      documento.addTitle(titulo);
      documento.addCreator(MARCA);
      documento.open();
      documento.add(encabezado(titulo));
      contenido.agregar(documento);
      documento.close();
    } catch (DocumentException ex) {
      throw new IllegalStateException("No se pudo generar el PDF " + titulo, ex);
    }
    return salida.toByteArray();
  }

  public static PdfPTable tabla(List<Reporte.Columna> columnas, List<List<String>> filas) {
    float[] anchos = new float[columnas.size()];
    for (int i = 0; i < anchos.length; i++) {
      anchos[i] = columnas.get(i).ancho();
    }
    PdfPTable tabla = new PdfPTable(anchos);
    tabla.setWidthPercentage(100);
    tabla.setHeaderRows(1);
    for (Reporte.Columna columna : columnas) {
      PdfPCell celda =
          celda(columna.nombre().toUpperCase(Locale.ROOT), fuenteNegrita(8, Color.WHITE));
      celda.setBackgroundColor(PRIMARIO);
      celda.setBorderColor(PRIMARIO);
      alinear(celda, columna);
      tabla.addCell(celda);
    }
    if (filas.isEmpty()) {
      PdfPCell vacia = celda("No hay datos para los filtros elegidos.", fuente(9, TEXTO_SUAVE));
      vacia.setColspan(columnas.size());
      vacia.setHorizontalAlignment(Element.ALIGN_CENTER);
      vacia.setPadding(12);
      tabla.addCell(vacia);
    }
    for (int i = 0; i < filas.size(); i++) {
      List<String> fila = filas.get(i);
      for (int j = 0; j < columnas.size(); j++) {
        PdfPCell celda = celda(fila.get(j), fuente(9, TEXTO));
        if (i % 2 == 1) {
          celda.setBackgroundColor(FONDO_SUAVE);
        }
        alinear(celda, columnas.get(j));
        tabla.addCell(celda);
      }
    }
    return tabla;
  }

  public static Font fuente(float tamano, Color color) {
    return FontFactory.getFont(
        FontFactory.HELVETICA, FontFactory.defaultEncoding, tamano, 0, color);
  }

  public static Font fuenteNegrita(float tamano, Color color) {
    return FontFactory.getFont(
        FontFactory.HELVETICA_BOLD, FontFactory.defaultEncoding, tamano, 0, color);
  }

  private static PdfPCell celda(String texto, Font fuente) {
    PdfPCell celda = new PdfPCell(new Phrase(texto, fuente));
    celda.setPaddingTop(5);
    celda.setPaddingBottom(6);
    celda.setPaddingLeft(6);
    celda.setPaddingRight(6);
    celda.setBorderColor(BORDE);
    celda.setBorderWidth(0.5f);
    celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
    return celda;
  }

  private static void alinear(PdfPCell celda, Reporte.Columna columna) {
    celda.setHorizontalAlignment(columna.numerica() ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
  }

  private static PdfPTable encabezado(String titulo) {
    PdfPTable encabezado = new PdfPTable(1);
    encabezado.setWidthPercentage(100);
    encabezado.setSpacingAfter(12);
    PdfPCell celda = new PdfPCell();
    celda.setBorder(Rectangle.BOTTOM);
    celda.setBorderColor(PRIMARIO);
    celda.setBorderWidth(1.5f);
    celda.setPaddingBottom(8);
    celda.addElement(new Paragraph(MARCA.toUpperCase(), fuenteNegrita(9, PRIMARIO)));
    celda.addElement(new Paragraph(titulo, fuenteNegrita(16, TEXTO)));
    encabezado.addCell(celda);
    return encabezado;
  }

  private static final class PiePagina extends PdfPageEventHelper {

    private final String generadoEn;

    private PiePagina(String generadoEn) {
      this.generadoEn = generadoEn;
    }

    @Override
    public void onEndPage(PdfWriter escritor, Document documento) {
      float y = documento.bottom() - 24;
      Font fuente = fuente(8, TEXTO_SUAVE);
      ColumnText.showTextAligned(
          escritor.getDirectContent(),
          Element.ALIGN_LEFT,
          new Phrase(MARCA + "  ·  " + generadoEn, fuente),
          documento.left(),
          y,
          0);
      ColumnText.showTextAligned(
          escritor.getDirectContent(),
          Element.ALIGN_RIGHT,
          new Phrase("Página " + escritor.getPageNumber(), fuente),
          documento.right(),
          y,
          0);
    }
  }
}
