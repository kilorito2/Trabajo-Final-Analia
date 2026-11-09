package ar.edu.utn.farmacia.usuario;

import ar.edu.utn.farmacia.auth.Rol;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.Locale;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "usuario")
@Getter
public class Usuario {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 50)
  private String username;

  @Setter
  @Column(name = "nombre_completo", nullable = false, length = 100)
  private String nombreCompleto;

  @Setter
  @Column(name = "password_hash", nullable = false, length = 100)
  private String passwordHash;

  @Setter
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Rol rol;

  @Setter
  @Column(nullable = false)
  private boolean activo;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  protected Usuario() {}

  public Usuario(
      String username,
      String nombreCompleto,
      String passwordHash,
      Rol rol,
      OffsetDateTime creadoEn) {
    this.username = normalizarUsername(username);
    this.nombreCompleto = nombreCompleto;
    this.passwordHash = passwordHash;
    this.rol = rol;
    this.activo = true;
    this.creadoEn = creadoEn;
  }

  public static String normalizarUsername(String username) {
    return username == null ? null : username.strip().toLowerCase(Locale.ROOT);
  }

  public boolean esAdminActivo() {
    return activo && rol == Rol.ADMIN;
  }
}
