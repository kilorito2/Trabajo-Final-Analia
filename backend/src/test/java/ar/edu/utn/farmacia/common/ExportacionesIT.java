package ar.edu.utn.farmacia.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import ar.edu.utn.farmacia.auth.Rol;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

/** Exportaciones de movimientos, proveedores, áreas, usuarios y alertas. */
class ExportacionesIT extends IntegracionBase {

  private static final String XLSX =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  @Test
  void movimientosDeUnMedicamentoConSuTipoYTransferencia() throws Exception {
    String token = tokenAdmin();
    Long proveedorId = crearProveedor(token);
    String codigo = "MOV-" + sufijo();
    Long medicamentoId = crearMedicamento(token, codigo, 0);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(60), 20);

    String csv = csv(exportar("/api/movimientos/exportar", token, "medicamentoId", medicamentoId));

    assertThat(csv).startsWith("Fecha y hora;Tipo;Medicamento;Lote;Cantidad;Saldo;Usuario;");
    assertThat(csv.split("\r\n")).hasSize(2);
    assertThat(csv).contains(";Ingreso;").contains(";20;20;admin;");
    assertThat(esPdf(exportarEn("/api/movimientos/exportar", token, "PDF"))).isTrue();
  }

  @Test
  void proveedoresYAreasRespetanLaBusqueda() throws Exception {
    String token = tokenAdmin();
    Long proveedorId = crearProveedor(token);
    String razonSocial =
        JsonPath.read(
            cuerpo(consultar("/api/proveedores/" + proveedorId, token).andReturn()),
            "$.razonSocial");

    String proveedores = csv(exportar("/api/proveedores/exportar", token, "q", razonSocial));
    assertThat(proveedores.split("\r\n")).hasSize(2);
    assertThat(proveedores).contains(razonSocial).contains(";0;Sí");

    String areas = csv(exportar("/api/areas/exportar", token, "q", "Guardia"));
    assertThat(areas).startsWith("Área;Activa").contains("Guardia;Sí");
    assertThat(esXlsx(exportarEn("/api/areas/exportar", token, "XLSX"))).isTrue();
  }

  @Test
  void usuariosSinElHashYSoloParaQuienLosGestiona() throws Exception {
    String token = tokenAdmin();
    String usuarios = csv(exportar("/api/usuarios/exportar", token, "q", "admin"));

    assertThat(usuarios).startsWith("Usuario;Nombre completo;Rol;Activo;Alta");
    assertThat(usuarios).contains("admin;").contains(";Administrador;Sí;");
    assertThat(usuarios.toLowerCase()).doesNotContain("$2a$").doesNotContain("hash");

    UsuarioDePrueba farmaceutico = crearUsuario(Rol.FARMACEUTICO);
    mockMvc
        .perform(conToken(get("/api/usuarios/exportar"), farmaceutico.token()))
        .andExpect(status().isForbidden());
  }

  @Test
  void alertasEnLosTresFormatos() throws Exception {
    String token = tokenAdmin();
    Long proveedorId = crearProveedor(token);
    Long medicamentoId = crearMedicamento(token, "ALE-" + sufijo(), 0);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(3), 4);

    String csv = csv(exportarEn("/api/alertas/exportar", token, "CSV"));
    assertThat(csv).startsWith("Alerta;Medicamento;Lote;Vencimiento;Días;");
    assertThat(csv).contains("Por vencer;");
    assertThat(esXlsx(exportarEn("/api/alertas/exportar", token, "XLSX"))).isTrue();
    assertThat(esPdf(exportarEn("/api/alertas/exportar", token, "PDF"))).isTrue();

    UsuarioDePrueba consulta = crearUsuario(Rol.CONSULTA);
    mockMvc
        .perform(conToken(get("/api/alertas/exportar"), consulta.token()))
        .andExpect(status().isOk());
  }

  private MvcResult exportar(String ruta, String token, String filtro, Object valor)
      throws Exception {
    return mockMvc
        .perform(
            conToken(get(ruta).param("formato", "CSV").param(filtro, String.valueOf(valor)), token))
        .andExpect(status().isOk())
        .andReturn();
  }

  private MvcResult exportarEn(String ruta, String token, String formato) throws Exception {
    return mockMvc
        .perform(conToken(get(ruta).param("formato", formato), token))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Disposition", containsString("attachment")))
        .andReturn();
  }

  private static String csv(MvcResult resultado) {
    byte[] bytes = resultado.getResponse().getContentAsByteArray();
    assertThat(bytes).startsWith((byte) 0xEF, (byte) 0xBB, (byte) 0xBF);
    return new String(bytes, StandardCharsets.UTF_8).substring(1);
  }

  private static boolean esPdf(MvcResult resultado) {
    byte[] bytes = resultado.getResponse().getContentAsByteArray();
    return bytes.length > 500
        && new String(bytes, 0, 5, StandardCharsets.ISO_8859_1).equals("%PDF-");
  }

  /** Un .xlsx es un ZIP: empieza con "PK" y declara el tipo de Excel. */
  private static boolean esXlsx(MvcResult resultado) {
    byte[] bytes = resultado.getResponse().getContentAsByteArray();
    return XLSX.equals(resultado.getResponse().getContentType())
        && bytes.length > 100
        && bytes[0] == 'P'
        && bytes[1] == 'K';
  }
}
