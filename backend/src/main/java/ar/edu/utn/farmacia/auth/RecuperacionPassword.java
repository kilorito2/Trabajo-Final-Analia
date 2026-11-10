package ar.edu.utn.farmacia.auth;

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
import java.time.OffsetDateTime;
import lombok.Getter;

/** Pedido de recuperación de contraseña: un código de un solo uso, con vencimiento e intentos. */
@Entity
@Table(name = "recuperacion_password")
@Getter
public class RecuperacionPassword {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @Column(name = "codigo_hash", nullable = false, length = 100)
  private String codigoHash;

  @Column(name = "creada_en", nullable = false)
  private OffsetDateTime creadaEn;

  @Column(name = "vence_en", nullable = false)
  private OffsetDateTime venceEn;

  @Column(name = "cerrada_en")
  private OffsetDateTime cerradaEn;

  @Column(nullable = false)
  private int intentos;

  protected RecuperacionPassword() {}

  public RecuperacionPassword(
      Usuario usuario, String codigoHash, OffsetDateTime creadaEn, OffsetDateTime venceEn) {
    if (!venceEn.isAfter(creadaEn)) {
      throw new IllegalArgumentException("El código tiene que vencer después de crearse.");
    }
    this.usuario = usuario;
    this.codigoHash = codigoHash;
    this.creadaEn = creadaEn;
    this.venceEn = venceEn;
  }

  public boolean estaVigente(OffsetDateTime ahora) {
    return cerradaEn == null && ahora.isBefore(venceEn);
  }

  /**
   * Cuenta un intento de usar el código. Si se pasa del máximo, lo cierra y devuelve false: así
   * nadie puede probar los códigos posibles uno por uno.
   */
  public boolean registrarIntento(int intentosMaximos, OffsetDateTime ahora) {
    intentos++;
    if (intentos > intentosMaximos) {
      cerrar(ahora);
      return false;
    }
    return true;
  }

  public void cerrar(OffsetDateTime ahora) {
    if (cerradaEn == null) {
      cerradaEn = ahora;
    }
  }
}
