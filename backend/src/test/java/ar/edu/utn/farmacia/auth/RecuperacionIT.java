package ar.edu.utn.farmacia.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ar.edu.utn.farmacia.IntegracionBase;
import com.jayway.jsonpath.JsonPath;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

class RecuperacionIT extends IntegracionBase {

  @Test
  void conElCodigoSeCreaUnaContrasenaNuevaYElCodigoNoSirveDosVeces() throws Exception {
    UsuarioDePrueba usuario = crearUsuario(Rol.CONSULTA);
    String codigo = solicitarCodigo(usuario.username());

    confirmar(usuario.username(), codigo, "clave-nueva-123").andExpect(status().isNoContent());

    login(usuario.username(), "clave-nueva-123");
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json(Map.of("username", usuario.username(), "password", usuario.password()))))
        .andExpect(status().isUnauthorized());
    confirmar(usuario.username(), codigo, "otra-clave-456")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.codigo").exists());
  }

  @Test
  void codigoIncorrectoDevuelveErrorEnElCampoYNoCambiaLaContrasena() throws Exception {
    UsuarioDePrueba usuario = crearUsuario(Rol.FARMACEUTICO);
    String codigo = solicitarCodigo(usuario.username());

    confirmar(usuario.username(), otroCodigo(codigo), "clave-nueva-123")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.errors.codigo").value(RecuperacionService.CODIGO_INVALIDO));

    login(usuario.username(), usuario.password());
  }

  @Test
  void despuesDeCincoIntentosFallidosElCodigoCorrectoTampocoSirve() throws Exception {
    UsuarioDePrueba usuario = crearUsuario(Rol.CONSULTA);
    String codigo = solicitarCodigo(usuario.username());

    for (int intento = 0; intento < 5; intento++) {
      confirmar(usuario.username(), otroCodigo(codigo), "clave-nueva-123")
          .andExpect(status().isBadRequest());
    }

    confirmar(usuario.username(), codigo, "clave-nueva-123")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.codigo").value(RecuperacionService.SIN_INTENTOS));
  }

  @Test
  void pedirUnCodigoNuevoAnulaElAnterior() throws Exception {
    UsuarioDePrueba usuario = crearUsuario(Rol.CONSULTA);
    String primero = solicitarCodigo(usuario.username());
    String segundo = solicitarCodigo(usuario.username());

    if (!primero.equals(segundo)) {
      confirmar(usuario.username(), primero, "clave-nueva-123").andExpect(status().isBadRequest());
    }
    confirmar(usuario.username(), segundo, "clave-nueva-123").andExpect(status().isNoContent());
  }

  @Test
  void usuarioInexistenteOInactivoRecibeLaMismaRespuestaSinCodigo() throws Exception {
    UsuarioDePrueba inactivo = crearUsuario(Rol.CONSULTA);
    desactivarUsuario(inactivo.id());

    for (String username : new String[] {"no-existe-" + sufijo(), inactivo.username()}) {
      solicitar(username)
          .andExpect(status().isAccepted())
          .andExpect(jsonPath("$.mensaje").value(RecuperacionService.MENSAJE_SOLICITUD))
          .andExpect(jsonPath("$.codigoSimulado").doesNotExist());
    }
  }

  @Test
  void validaElFormatoDelCodigoYLaLongitudDeLaContrasena() throws Exception {
    confirmar("alguien", "12ab", "corta")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.codigo").exists())
        .andExpect(jsonPath("$.errors.passwordNueva").exists());
  }

  private ResultActions solicitar(String username) throws Exception {
    return mockMvc.perform(
        post("/api/auth/recuperacion")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("username", username))));
  }

  private String solicitarCodigo(String username) throws Exception {
    MvcResult resultado = solicitar(username).andExpect(status().isAccepted()).andReturn();
    String codigo = JsonPath.read(cuerpo(resultado), "$.codigoSimulado");
    assertThat(codigo).matches("[0-9]{6}");
    return codigo;
  }

  private ResultActions confirmar(String username, String codigo, String passwordNueva)
      throws Exception {
    return mockMvc.perform(
        post("/api/auth/recuperacion/confirmar")
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                json(
                    Map.of(
                        "username", username, "codigo", codigo, "passwordNueva", passwordNueva))));
  }

  private static String otroCodigo(String codigo) {
    return String.format("%06d", (Integer.parseInt(codigo) + 1) % 1_000_000);
  }
}
