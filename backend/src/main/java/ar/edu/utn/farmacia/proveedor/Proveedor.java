package ar.edu.utn.farmacia.proveedor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "proveedor")
@Getter
public class Proveedor {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Setter
  @Column(name = "razon_social", nullable = false, length = 150)
  private String razonSocial;

  @Setter
  @Column(nullable = false, length = 11)
  private String cuit;

  @Setter
  @Column(length = 30)
  private String telefono;

  @Setter
  @Column(length = 120)
  private String email;

  @Setter
  @Column(nullable = false)
  private boolean activo;

  protected Proveedor() {}

  public Proveedor(String razonSocial, String cuit, String telefono, String email) {
    this.razonSocial = razonSocial;
    this.cuit = cuit;
    this.telefono = telefono;
    this.email = email;
    this.activo = true;
  }
}
