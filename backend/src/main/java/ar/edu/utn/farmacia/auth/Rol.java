package ar.edu.utn.farmacia.auth;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/** Único lugar donde se define qué puede hacer cada rol. El front lo recibe en /api/auth/me. */
public enum Rol {
  ADMIN(EnumSet.allOf(Permiso.class)),
  FARMACEUTICO(
      EnumSet.of(
          Permiso.LECTURA,
          Permiso.CATALOGO_EDITAR,
          Permiso.STOCK_INGRESAR,
          Permiso.STOCK_BAJA_AJUSTE,
          Permiso.TRANSFERENCIA_CREAR)),
  CONSULTA(EnumSet.of(Permiso.LECTURA));

  private final Set<Permiso> permisos;

  Rol(Set<Permiso> permisos) {
    this.permisos = Collections.unmodifiableSet(permisos);
  }

  public Set<Permiso> permisos() {
    return permisos;
  }
}
