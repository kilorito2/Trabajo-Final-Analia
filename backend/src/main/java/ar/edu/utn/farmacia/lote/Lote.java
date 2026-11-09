package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.medicamento.Medicamento;
import ar.edu.utn.farmacia.proveedor.Proveedor;
import ar.edu.utn.farmacia.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Getter;

/**
 * Invariante: 0 <= cantidadActual <= cantidadInicial. La cantidad solo cambia con los métodos de
 * esta clase, y la base lo vuelve a controlar con un CHECK.
 */
@Entity
@Table(name = "lote")
@Getter
public class Lote {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "medicamento_id")
  private Medicamento medicamento;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "proveedor_id")
  private Proveedor proveedor;

  @Column(name = "numero_lote", nullable = false, length = 50)
  private String numeroLote;

  @Column(name = "fecha_vencimiento", nullable = false)
  private LocalDate fechaVencimiento;

  @Column(name = "cantidad_inicial", nullable = false)
  private int cantidadInicial;

  @Column(name = "cantidad_actual", nullable = false)
  private int cantidadActual;

  @Column(name = "fecha_ingreso", nullable = false)
  private LocalDate fechaIngreso;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "registrado_por_id")
  private Usuario registradoPor;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  protected Lote() {}

  public Lote(
      Medicamento medicamento,
      Proveedor proveedor,
      String numeroLote,
      LocalDate fechaVencimiento,
      int cantidad,
      LocalDate fechaIngreso,
      Usuario registradoPor,
      OffsetDateTime creadoEn) {
    if (cantidad <= 0) {
      throw new IllegalArgumentException("La cantidad de un lote nuevo tiene que ser mayor a 0.");
    }
    this.medicamento = medicamento;
    this.proveedor = proveedor;
    this.numeroLote = numeroLote;
    this.fechaVencimiento = fechaVencimiento;
    this.cantidadInicial = cantidad;
    this.cantidadActual = cantidad;
    this.fechaIngreso = fechaIngreso;
    this.registradoPor = registradoPor;
    this.creadoEn = creadoEn;
  }

  /** El mismo día del vencimiento el lote todavía se puede usar. */
  public boolean estaVencido(LocalDate hoy) {
    return fechaVencimiento.isBefore(hoy);
  }

  public boolean tieneStock() {
    return cantidadActual > 0;
  }

  public EstadoLote estado(LocalDate hoy, int diasPorVencer) {
    if (cantidadActual == 0) {
      return EstadoLote.AGOTADO;
    }
    if (estaVencido(hoy)) {
      return EstadoLote.VENCIDO;
    }
    if (!fechaVencimiento.isAfter(hoy.plusDays(diasPorVencer))) {
      return EstadoLote.POR_VENCER;
    }
    return EstadoLote.VIGENTE;
  }

  public void descontar(int cantidad) {
    if (cantidad <= 0) {
      throw new IllegalArgumentException("La cantidad a descontar tiene que ser mayor a 0.");
    }
    if (cantidad > cantidadActual) {
      throw new IllegalStateException(
          "El lote "
              + numeroLote
              + " tiene "
              + cantidadActual
              + " unidades y se intentó descontar "
              + cantidad
              + ".");
    }
    cantidadActual -= cantidad;
  }

  /** Devuelve la diferencia con signo entre la cantidad nueva y la anterior. */
  public int ajustar(int cantidadNueva) {
    if (cantidadNueva < 0 || cantidadNueva > cantidadInicial) {
      throw new IllegalArgumentException(
          "La cantidad tiene que estar entre 0 y " + cantidadInicial + ".");
    }
    int diferencia = cantidadNueva - cantidadActual;
    cantidadActual = cantidadNueva;
    return diferencia;
  }

  /** Deja el lote en 0 y devuelve cuántas unidades se dieron de baja. */
  public int darDeBaja() {
    int baja = cantidadActual;
    cantidadActual = 0;
    return baja;
  }
}
