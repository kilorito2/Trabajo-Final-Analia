package ar.edu.utn.farmacia;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.proveedor.Cuits;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.json.JsonMapper;

/**
 * Base de los tests de integración. Todos usan la misma configuración, así Spring reutiliza un
 * único contexto y un único contenedor de PostgreSQL en toda la corrida. Los datos no se borran
 * entre tests: cada uno usa nombres y códigos únicos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({ContenedoresConfig.class, RelojFijoConfig.class})
public abstract class IntegracionBase {

  protected static final LocalDate HOY = RelojFijoConfig.HOY;
  protected static final String ADMIN_PASSWORD = "admin-tests-1234";

  private static final AtomicInteger SECUENCIA = new AtomicInteger();

  protected MockMvc mockMvc;
  protected JsonMapper jsonMapper;

  @BeforeEach
  void prepararBase(@Autowired MockMvc mockMvc, @Autowired JsonMapper jsonMapper) {
    this.mockMvc = mockMvc;
    this.jsonMapper = jsonMapper;
  }

  protected static String sufijo() {
    return System.nanoTime() % 100_000 + "-" + SECUENCIA.incrementAndGet();
  }

  protected String json(Object cuerpo) {
    return jsonMapper.writeValueAsString(cuerpo);
  }

  protected static String cuerpo(MvcResult resultado) throws Exception {
    return resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
  }

  protected static Long id(MvcResult resultado, String ruta) throws Exception {
    Number numero = JsonPath.read(cuerpo(resultado), ruta);
    return numero.longValue();
  }

  protected static MockHttpServletRequestBuilder conToken(
      MockHttpServletRequestBuilder pedido, String token) {
    return pedido.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
  }

  protected ResultActions enviar(MockHttpServletRequestBuilder pedido, String token, Object cuerpo)
      throws Exception {
    return mockMvc.perform(
        conToken(pedido, token).contentType(MediaType.APPLICATION_JSON).content(json(cuerpo)));
  }

  protected ResultActions consultar(String url, String token) throws Exception {
    return mockMvc.perform(conToken(get(url), token));
  }

  protected String login(String username, String password) throws Exception {
    MvcResult resultado =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("username", username, "password", password))))
            .andExpect(status().isOk())
            .andReturn();
    return JsonPath.read(cuerpo(resultado), "$.token");
  }

  protected String tokenAdmin() throws Exception {
    return login("admin", ADMIN_PASSWORD);
  }

  protected record UsuarioDePrueba(Long id, String username, String password, String token) {}

  protected UsuarioDePrueba crearUsuario(Rol rol) throws Exception {
    String username = "u" + sufijo().replace("-", "");
    String password = "clave-" + username;
    MvcResult resultado =
        enviar(
                post("/api/usuarios"),
                tokenAdmin(),
                Map.of(
                    "username",
                    username,
                    "nombreCompleto",
                    "Usuario " + username,
                    "rol",
                    rol.name(),
                    "password",
                    password))
            .andExpect(status().isCreated())
            .andReturn();
    return new UsuarioDePrueba(
        id(resultado, "$.id"), username, password, login(username, password));
  }

  protected void desactivarUsuario(Long id) throws Exception {
    enviar(patch("/api/usuarios/" + id + "/estado"), tokenAdmin(), Map.of("activo", false))
        .andExpect(status().isNoContent());
  }

  protected Long crearArea(String token) throws Exception {
    MvcResult resultado =
        enviar(post("/api/areas"), token, Map.of("nombre", "Área " + sufijo()))
            .andExpect(status().isCreated())
            .andReturn();
    return id(resultado, "$.id");
  }

  protected Long crearProveedor(String token) throws Exception {
    MvcResult resultado =
        enviar(
                post("/api/proveedores"),
                token,
                Map.of("razonSocial", "Proveedor " + sufijo(), "cuit", cuitNuevo()))
            .andExpect(status().isCreated())
            .andReturn();
    return id(resultado, "$.id");
  }

  protected Long crearMedicamento(String token, String codigo, int stockMinimo) throws Exception {
    MvcResult resultado =
        enviar(
                post("/api/medicamentos"),
                token,
                Map.of(
                    "codigo",
                    codigo,
                    "nombre",
                    "Medicamento " + codigo,
                    "presentacion",
                    "comprimidos 500 mg",
                    "stockMinimo",
                    stockMinimo))
            .andExpect(status().isCreated())
            .andReturn();
    return id(resultado, "$.id");
  }

  protected Long ingresarLote(
      String token, Long medicamentoId, Long proveedorId, LocalDate vencimiento, int cantidad)
      throws Exception {
    MvcResult resultado =
        enviar(
                post("/api/medicamentos/" + medicamentoId + "/lotes"),
                token,
                Map.of(
                    "proveedorId",
                    proveedorId,
                    "numeroLote",
                    "L-" + sufijo(),
                    "fechaVencimiento",
                    vencimiento.toString(),
                    "cantidad",
                    cantidad))
            .andExpect(status().isCreated())
            .andReturn();
    return id(resultado, "$.lote.id");
  }

  protected static Map<String, Object> transferencia(Long areaId, List<Map<String, Object>> items) {
    return Map.of("areaId", areaId, "items", items);
  }

  protected static Map<String, Object> item(Long medicamentoId, int cantidad) {
    return Map.of("medicamentoId", medicamentoId, "cantidad", cantidad);
  }

  /** Un CUIT válido y distinto en cada llamada. */
  protected static String cuitNuevo() {
    while (true) {
      String base = "30" + String.format("%08d", Math.floorMod(System.nanoTime(), 100_000_000L));
      for (int verificador = 0; verificador <= 9; verificador++) {
        if (Cuits.esValido(base + verificador)) {
          return base + verificador;
        }
      }
    }
  }
}
