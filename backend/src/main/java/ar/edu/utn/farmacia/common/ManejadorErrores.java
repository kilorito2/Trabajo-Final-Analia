package ar.edu.utn.farmacia.common;

import ar.edu.utn.farmacia.auth.CredencialesInvalidasException;
import ar.edu.utn.farmacia.transferencia.StockInsuficienteException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ManejadorErrores extends ResponseEntityExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

  private static final Map<String, String> RESTRICCIONES_UNICAS =
      Map.of(
          "uq_medicamento_codigo", "CODIGO_DUPLICADO",
          "uq_lote_medicamento_numero", "LOTE_DUPLICADO",
          "uq_proveedor_cuit", "CUIT_DUPLICADO",
          "uq_usuario_username", "USERNAME_DUPLICADO",
          "ux_area_nombre", "NOMBRE_DUPLICADO");

  @ExceptionHandler(RecursoNoEncontradoException.class)
  ProblemDetail noEncontrado(RecursoNoEncontradoException ex) {
    return Problemas.crear(HttpStatus.NOT_FOUND, "No encontrado", ex.getMessage(), "NO_ENCONTRADO");
  }

  @ExceptionHandler(ReglaNegocioException.class)
  ProblemDetail reglaNegocio(ReglaNegocioException ex) {
    return Problemas.crear(
        HttpStatus.CONFLICT, "Operación rechazada", ex.getMessage(), ex.getCodigo());
  }

  @ExceptionHandler(StockInsuficienteException.class)
  ProblemDetail stockInsuficiente(StockInsuficienteException ex) {
    ProblemDetail problema =
        Problemas.crear(
            HttpStatus.CONFLICT, "Stock insuficiente", ex.getMessage(), "STOCK_INSUFICIENTE");
    problema.setProperty("faltantes", ex.getFaltantes());
    return problema;
  }

  @ExceptionHandler(ErrorDeCampoException.class)
  ProblemDetail errorDeCampo(ErrorDeCampoException ex) {
    return validacion(Map.of(ex.getCampo(), ex.getMessage()));
  }

  @ExceptionHandler(ParametroInvalidoException.class)
  ProblemDetail parametroInvalido(ParametroInvalidoException ex) {
    return Problemas.crear(
        HttpStatus.BAD_REQUEST, "Parámetro inválido", ex.getMessage(), ex.getCodigo());
  }

  @ExceptionHandler(CredencialesInvalidasException.class)
  ProblemDetail credencialesInvalidas(CredencialesInvalidasException ex) {
    return Problemas.crear(
        HttpStatus.UNAUTHORIZED, "No autenticado", ex.getMessage(), "NO_AUTENTICADO");
  }

  // @PreAuthorize lanza la excepción dentro del controlador; sin este manejador terminaría en el
  // 500 genérico.
  @ExceptionHandler(AccessDeniedException.class)
  ProblemDetail accesoDenegado(AccessDeniedException ex) {
    return Problemas.sinPermiso();
  }

  // Los duplicados se controlan antes en el servicio; esto cubre dos pedidos simultáneos.
  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integridad(DataIntegrityViolationException ex) {
    String mensaje = String.valueOf(ex.getMostSpecificCause().getMessage());
    return RESTRICCIONES_UNICAS.entrySet().stream()
        .filter(restriccion -> mensaje.contains(restriccion.getKey()))
        .findFirst()
        .map(
            restriccion ->
                Problemas.crear(
                    HttpStatus.CONFLICT,
                    "Dato duplicado",
                    "Ya existe un registro con ese valor.",
                    restriccion.getValue()))
        .orElseGet(
            () ->
                Problemas.crear(
                    HttpStatus.CONFLICT,
                    "Operación rechazada",
                    "La operación no respeta las reglas de los datos.",
                    "CONFLICTO_DATOS"));
  }

  @ExceptionHandler(Exception.class)
  ProblemDetail inesperado(Exception ex) {
    String errorId = UUID.randomUUID().toString();
    log.error("Error inesperado {}", errorId, ex);
    ProblemDetail problema =
        Problemas.crear(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Error interno",
            "Ocurrió un error inesperado.",
            "ERROR_INTERNO");
    problema.setProperty("errorId", errorId);
    return problema;
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    Map<String, String> errores = new LinkedHashMap<>();
    for (FieldError error : ex.getBindingResult().getFieldErrors()) {
      errores.putIfAbsent(error.getField(), error.getDefaultMessage());
    }
    ex.getBindingResult()
        .getGlobalErrors()
        .forEach(error -> errores.putIfAbsent(error.getObjectName(), error.getDefaultMessage()));
    return ResponseEntity.badRequest().body(validacion(errores));
  }

  @Override
  protected ResponseEntity<Object> handleHandlerMethodValidationException(
      HandlerMethodValidationException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    Map<String, String> errores = new LinkedHashMap<>();
    ex.getParameterValidationResults()
        .forEach(
            resultado ->
                resultado
                    .getResolvableErrors()
                    .forEach(
                        error ->
                            errores.putIfAbsent(
                                resultado.getMethodParameter().getParameterName(),
                                error.getDefaultMessage())));
    return ResponseEntity.badRequest().body(validacion(errores));
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    return ResponseEntity.badRequest()
        .body(
            Problemas.crear(
                HttpStatus.BAD_REQUEST,
                "Cuerpo inválido",
                "El cuerpo del pedido no es un JSON válido o tiene datos de un tipo incorrecto.",
                "CUERPO_INVALIDO"));
  }

  @Override
  protected ResponseEntity<Object> handleTypeMismatch(
      TypeMismatchException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    String nombre = ex.getPropertyName() == null ? "recibido" : "'" + ex.getPropertyName() + "'";
    return ResponseEntity.badRequest()
        .body(
            Problemas.crear(
                HttpStatus.BAD_REQUEST,
                "Parámetro inválido",
                "El parámetro " + nombre + " tiene un valor inválido.",
                "PARAMETRO_INVALIDO"));
  }

  @Override
  protected ResponseEntity<Object> handleMissingServletRequestParameter(
      MissingServletRequestParameterException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    return ResponseEntity.badRequest()
        .body(
            Problemas.crear(
                HttpStatus.BAD_REQUEST,
                "Parámetro inválido",
                "Falta el parámetro '" + ex.getParameterName() + "'.",
                "PARAMETRO_INVALIDO"));
  }

  @Override
  protected ResponseEntity<Object> handleNoResourceFoundException(
      NoResourceFoundException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(
            Problemas.crear(
                HttpStatus.NOT_FOUND,
                "No encontrado",
                "No existe el recurso pedido.",
                "NO_ENCONTRADO"));
  }

  // El resto de las excepciones de Spring MVC (405, 415, etc.) conserva su status, pero con el
  // mismo formato: título en español y codigo.
  @Override
  protected ResponseEntity<Object> handleExceptionInternal(
      Exception ex,
      Object body,
      HttpHeaders headers,
      HttpStatusCode statusCode,
      WebRequest request) {
    if (body instanceof ProblemDetail problema && problema.getProperties() == null) {
      problema.setTitle("Pedido inválido");
      problema.setProperty(Problemas.CODIGO, "PEDIDO_INVALIDO");
    }
    return super.handleExceptionInternal(ex, body, headers, statusCode, request);
  }

  private static ProblemDetail validacion(Map<String, String> errores) {
    ProblemDetail problema =
        Problemas.crear(
            HttpStatus.BAD_REQUEST,
            "Datos inválidos",
            "Revisá los datos ingresados.",
            "VALIDACION");
    problema.setProperty("errors", errores);
    return problema;
  }
}
