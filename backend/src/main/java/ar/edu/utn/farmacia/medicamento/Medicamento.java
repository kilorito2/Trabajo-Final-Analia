package ar.edu.utn.farmacia.medicamento;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** El stock total no se guarda: es la suma de cantidadActual de sus lotes no vencidos. */
@Entity
@Table(name = "medicamento")
@Getter
public class Medicamento {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Setter
  @Column(nullable = false, length = 30)
  private String codigo;

  @Setter
  @Column(nullable = false, length = 120)
  private String nombre;

  @Setter
  @Column(nullable = false, length = 120)
  private String presentacion;

  @Setter
  @Column(name = "stock_minimo", nullable = false)
  private int stockMinimo;

  @Setter
  @Column(nullable = false)
  private boolean activo;

  protected Medicamento() {}

  public Medicamento(String codigo, String nombre, String presentacion, int stockMinimo) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.presentacion = presentacion;
    this.stockMinimo = stockMinimo;
    this.activo = true;
  }

  /** Por ejemplo, "Amoxicilina comprimidos 500 mg". */
  public String descripcion() {
    return nombre + " " + presentacion;
  }
}
