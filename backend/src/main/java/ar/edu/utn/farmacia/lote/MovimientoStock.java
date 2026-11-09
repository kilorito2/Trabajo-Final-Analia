package ar.edu.utn.farmacia.lote;

import ar.edu.utn.farmacia.transferencia.Transferencia;
import ar.edu.utn.farmacia.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;

/**
 * Traza de auditoría: cada cambio de stock deja exactamente un movimiento por lote. La suma de las
 * cantidades de un lote es igual a su cantidadActual.
 */
@Entity
@Table(name = "movimiento_stock")
@Getter
public class MovimientoStock {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lote_id")
  private Lote lote;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private TipoMovimiento tipo;

  @Column(nullable = false)
  private int cantidad;

  @Column(name = "saldo_resultante", nullable = false)
  private int saldoResultante;

  @Column(name = "fecha_hora", nullable = false)
  private OffsetDateTime fechaHora;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id")
  private Usuario usuario;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "transferencia_id")
  private Transferencia transferencia;

  @Column(length = 200)
  private String motivo;

  protected MovimientoStock() {}

  private MovimientoStock(
      Lote lote,
      TipoMovimiento tipo,
      int cantidad,
      OffsetDateTime fechaHora,
      Usuario usuario,
      Transferencia transferencia,
      String motivo) {
    if (cantidad == 0) {
      throw new IllegalArgumentException("Un movimiento no puede tener cantidad 0.");
    }
    this.lote = lote;
    this.tipo = tipo;
    this.cantidad = cantidad;
    this.saldoResultante = lote.getCantidadActual();
    this.fechaHora = fechaHora;
    this.usuario = usuario;
    this.transferencia = transferencia;
    this.motivo = motivo;
  }

  public static MovimientoStock ingreso(Lote lote, OffsetDateTime fechaHora, Usuario usuario) {
    return new MovimientoStock(
        lote, TipoMovimiento.INGRESO, lote.getCantidadInicial(), fechaHora, usuario, null, null);
  }

  public static MovimientoStock egreso(
      Lote lote,
      int cantidad,
      OffsetDateTime fechaHora,
      Usuario usuario,
      Transferencia transferencia) {
    return new MovimientoStock(
        lote, TipoMovimiento.EGRESO, -cantidad, fechaHora, usuario, transferencia, null);
  }

  public static MovimientoStock bajaPorVencimiento(
      Lote lote, int cantidad, OffsetDateTime fechaHora, Usuario usuario, String motivo) {
    return new MovimientoStock(
        lote, TipoMovimiento.BAJA_VENCIMIENTO, -cantidad, fechaHora, usuario, null, motivo);
  }

  public static MovimientoStock ajuste(
      Lote lote, int diferencia, OffsetDateTime fechaHora, Usuario usuario, String motivo) {
    return new MovimientoStock(
        lote, TipoMovimiento.AJUSTE, diferencia, fechaHora, usuario, null, motivo);
  }
}
