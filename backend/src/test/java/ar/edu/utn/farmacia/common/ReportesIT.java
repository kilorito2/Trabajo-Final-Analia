package ar.edu.utn.farmacia.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import ar.edu.utn.farmacia.auth.Rol;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

class ReportesIT extends IntegracionBase {

  @Test
  void stockDeMedicamentosEnCsvRespetaLosFiltros() throws Exception {
    String token = tokenAdmin();
    String codigo = "REP-" + sufijo();
    crearMedicamento(token, codigo, 10);

    String csv =
        csv(
            consultar("/api/medicamentos/exportar?formato=CSV&estado=SIN_STOCK&q=" + codigo, token)
                .andExpect(status().isOk())
                .andExpect(
                    header()
                        .string(
                            "Content-Disposition",
                            "attachment; filename=\"stock_medicamentos.csv\""))
                .andReturn());

    List<String> lineas = Arrays.asList(csv.split("\r\n"));
    assertThat(lineas.get(0))
        .isEqualTo(
            "Código;Nombre;Presentación;Stock total;Stock mínimo;Próximo vencimiento;Estado;Activo");
    assertThat(lineas).hasSize(2);
    assertThat(lineas.get(1)).startsWith(codigo + ";").contains(";0;10;;Sin stock;Sí");
  }

  @Test
  void stockDeMedicamentosEnPdf() throws Exception {
    MvcResult resultado =
        consultar("/api/medicamentos/exportar?formato=PDF", tokenAdmin())
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andExpect(
                header()
                    .string(
                        "Content-Disposition", "attachment; filename=\"stock_medicamentos.pdf\""))
            .andReturn();
    assertThat(esPdf(resultado)).isTrue();
  }

  @Test
  void lotesVencidosYPorVencerEnCsvYPdf() throws Exception {
    String token = tokenAdmin();
    Long proveedorId = crearProveedor(token);
    Long medicamentoId = crearMedicamento(token, "VTO-" + sufijo(), 0);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(5), 12);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(200), 30);

    String csv =
        csv(
            consultar(
                    "/api/lotes/exportar?medicamentoId="
                        + medicamentoId
                        + "&estado=POR_VENCER&estado=VENCIDO",
                    token)
                .andExpect(status().isOk())
                .andReturn());
    String[] lineas = csv.split("\r\n");
    assertThat(lineas).hasSize(2);
    assertThat(lineas[0]).startsWith("Medicamento;Lote;Proveedor;Vencimiento;Días;");
    assertThat(lineas[1]).contains(";5;12;12;").endsWith(";Por vencer");

    MvcResult pdf =
        consultar("/api/lotes/exportar?formato=PDF&estado=POR_VENCER", token)
            .andExpect(status().isOk())
            .andReturn();
    assertThat(esPdf(pdf)).isTrue();
  }

  @Test
  void comprobanteYReporteDeTransferenciasEnPdf() throws Exception {
    String token = tokenAdmin();
    Long areaId = crearArea(token);
    Long proveedorId = crearProveedor(token);
    Long medicamentoId = crearMedicamento(token, "PDF-" + sufijo(), 0);
    ingresarLote(token, medicamentoId, proveedorId, HOY.plusDays(90), 20);
    MvcResult creada =
        enviar(
                post("/api/transferencias"),
                token,
                transferencia(areaId, List.of(item(medicamentoId, 4))))
            .andExpect(status().isCreated())
            .andReturn();
    Long transferenciaId = id(creada, "$.id");

    MvcResult comprobante =
        consultar("/api/transferencias/" + transferenciaId + "/pdf", token)
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andReturn();
    assertThat(esPdf(comprobante)).isTrue();

    MvcResult reporte =
        consultar(
                "/api/transferencias/exportar?formato=PDF&desde="
                    + HOY
                    + "&hasta="
                    + HOY
                    + "&areaId="
                    + areaId,
                token)
            .andExpect(status().isOk())
            .andExpect(
                header()
                    .string(
                        "Content-Disposition",
                        "attachment; filename=\"transferencias_" + HOY + "_" + HOY + ".pdf\""))
            .andReturn();
    assertThat(esPdf(reporte)).isTrue();
  }

  @Test
  void comprobanteInexistenteDevuelve404() throws Exception {
    consultar("/api/transferencias/999999999/pdf", tokenAdmin())
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.codigo").value("NO_ENCONTRADO"));
  }

  @Test
  void formatoDesconocidoDevuelve400() throws Exception {
    consultar("/api/medicamentos/exportar?formato=XLS", tokenAdmin())
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("PARAMETRO_INVALIDO"));
  }

  @Test
  void elRolConsultaPuedeExportarPeroSinTokenNo() throws Exception {
    UsuarioDePrueba consulta = crearUsuario(Rol.CONSULTA);
    consultar("/api/lotes/exportar?formato=PDF", consulta.token()).andExpect(status().isOk());
    mockMvc.perform(get("/api/lotes/exportar")).andExpect(status().isUnauthorized());
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
}
