package ar.edu.utn.farmacia.transferencia;

import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transferencias")
@RequiredArgsConstructor
public class TransferenciaController {

  private static final MediaType CSV = MediaType.parseMediaType("text/csv;charset=UTF-8");

  private final TransferenciaService transferenciaService;

  @PostMapping
  @PreAuthorize("hasAuthority('TRANSFERENCIA_CREAR')")
  public ResponseEntity<TransferenciaResponse> transferir(
      @Valid @RequestBody TransferenciaRequest pedido) {
    TransferenciaResponse creada = transferenciaService.transferir(pedido);
    return ResponseEntity.created(URI.create("/api/transferencias/" + creada.id())).body(creada);
  }

  @GetMapping
  @PreAuthorize("hasAuthority('LECTURA')")
  public Page<TransferenciaResumen> listar(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate desde,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate hasta,
      @RequestParam(required = false) Long areaId,
      @PageableDefault(size = 20, sort = "fechaHora", direction = Sort.Direction.DESC)
          Pageable pagina) {
    return transferenciaService.listar(desde, hasta, areaId, pagina);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('LECTURA')")
  public TransferenciaResponse obtener(@PathVariable Long id) {
    return transferenciaService.obtener(id);
  }

  @GetMapping("/exportar")
  @PreAuthorize("hasAuthority('LECTURA')")
  public ResponseEntity<byte[]> exportar(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
      @RequestParam(required = false) Long areaId) {
    byte[] csv = transferenciaService.exportar(desde, hasta, areaId);
    String archivo = "transferencias_" + desde + "_" + hasta + ".csv";
    return ResponseEntity.ok()
        .contentType(CSV)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(archivo).build().toString())
        .body(csv);
  }
}
