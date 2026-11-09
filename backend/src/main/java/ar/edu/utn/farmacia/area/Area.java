package ar.edu.utn.farmacia.area;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "area")
@Getter
public class Area {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Setter
  @Column(nullable = false, length = 80)
  private String nombre;

  @Setter
  @Column(nullable = false)
  private boolean activo;

  protected Area() {}

  public Area(String nombre) {
    this.nombre = nombre;
    this.activo = true;
  }
}
