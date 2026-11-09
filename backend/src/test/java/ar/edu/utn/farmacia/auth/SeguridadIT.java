package ar.edu.utn.farmacia.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.web.servlet.MvcResult;

class SeguridadIT extends IntegracionBase {

  private JwtEncoder jwtEncoder;
  private Clock clock;

  @BeforeEach
  void preparar(@Autowired JwtEncoder jwtEncoder, @Autowired Clock clock) {
    this.jwtEncoder = jwtEncoder;
    this.clock = clock;
  }

  @Test
  void sinTokenDevuelve401EnJsonSinRedirigir() throws Exception {
    mockMvc
        .perform(get("/api/medicamentos"))
        .andExpect(status().isUnauthorized())
        .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
        .andExpect(header().doesNotExist(HttpHeaders.LOCATION))
        .andExpect(jsonPath("$.codigo").value("NO_AUTENTICADO"))
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void tokenConFirmaInvalidaDevuelve401() throws Exception {
    byte[] otraClave =
        "otra-clave-distinta-con-mas-de-32-bytes-000".getBytes(StandardCharsets.UTF_8);
    JwtEncoder falsificador =
        NimbusJwtEncoder.withSecretKey(new SecretKeySpec(otraClave, "HmacSHA256"))
            .algorithm(MacAlgorithm.HS256)
            .build();
    String token =
        firmar(falsificador, idAdmin(), clock.instant(), clock.instant().plusSeconds(3600));

    consultar("/api/auth/me", token)
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.codigo").value("NO_AUTENTICADO"));
  }

  @Test
  void tokenVencidoDevuelve401() throws Exception {
    Instant ahora = clock.instant();
    String token =
        firmar(jwtEncoder, idAdmin(), ahora.minusSeconds(9 * 3600), ahora.minusSeconds(120));

    consultar("/api/auth/me", token).andExpect(status().isUnauthorized());
  }

  @Test
  void tokenDeUnUsuarioDesactivadoDevuelve401() throws Exception {
    UsuarioDePrueba usuario = crearUsuario(Rol.CONSULTA);
    consultar("/api/auth/me", usuario.token()).andExpect(status().isOk());

    desactivarUsuario(usuario.id());

    consultar("/api/auth/me", usuario.token()).andExpect(status().isUnauthorized());
  }

  @Test
  void consultaNoPuedeCrearMedicamentos() throws Exception {
    UsuarioDePrueba consulta = crearUsuario(Rol.CONSULTA);

    enviar(
            post("/api/medicamentos"),
            consulta.token(),
            Map.of(
                "codigo",
                "SEG-" + sufijo(),
                "nombre",
                "Prueba",
                "presentacion",
                "ampolla",
                "stockMinimo",
                1))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("SIN_PERMISO"));
  }

  @Test
  void farmaceuticoNoPuedeGestionarUsuarios() throws Exception {
    UsuarioDePrueba farmaceutico = crearUsuario(Rol.FARMACEUTICO);

    consultar("/api/usuarios", farmaceutico.token())
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("SIN_PERMISO"));
  }

  @Test
  void laCabeceraXUserIdNoCambiaLaIdentidad() throws Exception {
    UsuarioDePrueba consulta = crearUsuario(Rol.CONSULTA);

    mockMvc
        .perform(
            conToken(get("/api/auth/me"), consulta.token())
                .header("X-User-Id", idAdmin().toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(consulta.username()))
        .andExpect(jsonPath("$.rol").value("CONSULTA"));
    mockMvc
        .perform(
            conToken(get("/api/usuarios"), consulta.token())
                .header("X-User-Id", idAdmin().toString()))
        .andExpect(status().isForbidden());
  }

  @Test
  void contrasenaIncorrectaYUsuarioInexistenteRespondenIgual() throws Exception {
    MvcResult incorrecta = intentarLogin("admin", "no-es-la-clave");
    MvcResult inexistente = intentarLogin("nadie-" + sufijo(), "no-es-la-clave");

    assertThat(incorrecta.getResponse().getStatus()).isEqualTo(401);
    assertThat(inexistente.getResponse().getStatus()).isEqualTo(401);
    String detalle = JsonPath.read(cuerpo(incorrecta), "$.detail");
    assertThat(detalle).isEqualTo("Usuario o contraseña incorrectos.");
    assertThat((String) JsonPath.read(cuerpo(inexistente), "$.detail")).isEqualTo(detalle);
  }

  @Test
  void ningunaRespuestaExponeLaContrasenaNiElHash() throws Exception {
    String token = tokenAdmin();
    MvcResult login =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("username", "admin", "password", ADMIN_PASSWORD))))
            .andExpect(status().isOk())
            .andReturn();
    String tokenDelLogin = JsonPath.read(cuerpo(login), "$.token");

    assertSinSecretos(cuerpo(login).replace(tokenDelLogin, ""));
    assertSinSecretos(cuerpo(consultar("/api/auth/me", token).andReturn()));
    assertSinSecretos(cuerpo(consultar("/api/usuarios?size=100", token).andReturn()));
    assertSinSecretos(cuerpo(crearUsuarioYDevolverRespuesta(token)));
  }

  private MvcResult crearUsuarioYDevolverRespuesta(String token) throws Exception {
    String username = "h" + sufijo().replace("-", "");
    return enviar(
            post("/api/usuarios"),
            token,
            Map.of(
                "username",
                username,
                "nombreCompleto",
                "Usuario Prueba",
                "rol",
                "CONSULTA",
                "password",
                "una-clave-segura"))
        .andExpect(status().isCreated())
        .andReturn();
  }

  private static void assertSinSecretos(String json) {
    String minusculas = json.toLowerCase(Locale.ROOT);
    assertThat(minusculas).doesNotContain("password").doesNotContain("hash").doesNotContain("$2a$");
  }

  private MvcResult intentarLogin(String username, String password) throws Exception {
    return mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("username", username, "password", password))))
        .andReturn();
  }

  private Long idAdmin() throws Exception {
    return id(consultar("/api/auth/me", tokenAdmin()).andReturn(), "$.id");
  }

  private static String firmar(JwtEncoder encoder, Long usuarioId, Instant emitido, Instant vence) {
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer(JwtProperties.EMISOR)
            .subject(usuarioId.toString())
            .issuedAt(emitido)
            .expiresAt(vence)
            .build();
    return encoder
        .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
        .getTokenValue();
  }
}
