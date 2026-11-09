package ar.edu.utn.farmacia.transferencia;

import ar.edu.utn.farmacia.area.Area;
import ar.edu.utn.farmacia.usuario.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.Getter;

/** Inmutable una vez creada: no hay setters ni endpoints para editarla o borrarla. */
@Entity
@Table(name = "transferencia")
@Getter
public class Transferencia {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "fecha_hora", nullable = false)
  private OffsetDateTime fechaHora;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "area_id")
  private Area area;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "realizada_por_id")
  private Usuario realizadaPor;

  @Column(length = 500)
  private String observaciones;

  @OneToMany(mappedBy = "transferencia", cascade = CascadeType.PERSIST)
  @OrderBy("id")
  private List<DetalleTransferencia> detalle = new ArrayList<>();

  protected Transferencia() {}

  public Transferencia(
      OffsetDateTime fechaHora, Area area, Usuario realizadaPor, String observaciones) {
    this.fechaHora = fechaHora;
    this.area = area;
    this.realizadaPor = realizadaPor;
    this.observaciones = observaciones;
  }

  void agregarDetalle(DetalleTransferencia linea) {
    detalle.add(linea);
  }

  public List<DetalleTransferencia> getDetalle() {
    return Collections.unmodifiableList(detalle);
  }

  /** Número visible: "TR-000123". */
  public static String numero(Long id) {
    return id == null ? null : String.format("TR-%06d", id);
  }
}
