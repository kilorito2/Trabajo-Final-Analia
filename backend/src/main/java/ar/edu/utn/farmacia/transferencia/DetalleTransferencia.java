package ar.edu.utn.farmacia.transferencia;

import ar.edu.utn.farmacia.lote.Lote;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

/** Una fila por lote afectado: registra de qué lote salió cada unidad. */
@Entity
@Table(name = "detalle_transferencia")
@Getter
public class DetalleTransferencia {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "transferencia_id")
  private Transferencia transferencia;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lote_id")
  private Lote lote;

  @Column(nullable = false)
  private int cantidad;

  protected DetalleTransferencia() {}

  DetalleTransferencia(Transferencia transferencia, Lote lote, int cantidad) {
    if (cantidad <= 0) {
      throw new IllegalArgumentException("La cantidad de un detalle tiene que ser mayor a 0.");
    }
    this.transferencia = transferencia;
    this.lote = lote;
    this.cantidad = cantidad;
  }
}
