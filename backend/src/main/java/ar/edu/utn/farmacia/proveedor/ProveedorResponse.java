package ar.edu.utn.farmacia.proveedor;

import jakarta.validation.constraints.NotNull;

public record ProveedorResponse(
    @NotNull Long id,
    @NotNull String razonSocial,
    @NotNull String cuit,
    String telefono,
    String email,
    boolean activo,
    long lotesConStock) {

  public static ProveedorResponse desde(Proveedor proveedor, long lotesConStock) {
    return new ProveedorResponse(
        proveedor.getId(),
        proveedor.getRazonSocial(),
        Cuits.formatear(proveedor.getCuit()),
        proveedor.getTelefono(),
        proveedor.getEmail(),
        proveedor.isActivo(),
        lotesConStock);
  }
}
