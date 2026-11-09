package ar.edu.utn.farmacia.proveedor;

import ar.edu.utn.farmacia.common.Textos;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProveedorRequest(
    @NotBlank(message = "Ingresá la razón social.")
        @Size(max = 150, message = "La razón social admite hasta 150 caracteres.")
        String razonSocial,
    @NotBlank(message = "Ingresá el CUIT.") @Cuit String cuit,
    @Size(max = 30, message = "El teléfono admite hasta 30 caracteres.") String telefono,
    @Email(message = "El email no es válido.")
        @Size(max = 120, message = "El email admite hasta 120 caracteres.")
        String email) {

  public ProveedorRequest {
    razonSocial = Textos.limpiar(razonSocial);
    cuit = Cuits.normalizar(cuit);
    telefono = Textos.limpiarOpcional(telefono);
    email = Textos.limpiarOpcional(email);
  }
}
