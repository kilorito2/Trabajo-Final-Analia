package ar.edu.utn.farmacia.demo;

import ar.edu.utn.farmacia.area.Area;
import ar.edu.utn.farmacia.area.AreaRepository;
import ar.edu.utn.farmacia.auth.Rol;
import ar.edu.utn.farmacia.common.FarmaciaProperties;
import ar.edu.utn.farmacia.lote.IngresoRequest;
import ar.edu.utn.farmacia.lote.Lote;
import ar.edu.utn.farmacia.lote.LoteRepository;
import ar.edu.utn.farmacia.lote.LoteService;
import ar.edu.utn.farmacia.lote.MovimientoStock;
import ar.edu.utn.farmacia.lote.MovimientoStockRepository;
import ar.edu.utn.farmacia.medicamento.MedicamentoRepository;
import ar.edu.utn.farmacia.medicamento.MedicamentoRequest;
import ar.edu.utn.farmacia.medicamento.MedicamentoService;
import ar.edu.utn.farmacia.proveedor.ProveedorRepository;
import ar.edu.utn.farmacia.proveedor.ProveedorRequest;
import ar.edu.utn.farmacia.proveedor.ProveedorService;
import ar.edu.utn.farmacia.transferencia.StockInsuficienteException;
import ar.edu.utn.farmacia.transferencia.TransferenciaRequest;
import ar.edu.utn.farmacia.transferencia.TransferenciaService;
import ar.edu.utn.farmacia.usuario.Usuario;
import ar.edu.utn.farmacia.usuario.UsuarioRepository;
import ar.edu.utn.farmacia.usuario.UsuarioRequest;
import ar.edu.utn.farmacia.usuario.UsuarioService;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Carga datos de ejemplo usando los mismos servicios que la API, así los movimientos cierran con el
 * stock y las fechas quedan relativas a hoy. Es idempotente: si ya hay medicamentos, no hace nada.
 */
@Component
@Profile("demo")
@Order(2)
@RequiredArgsConstructor
public class DemoDataLoader implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

  private static final int DIAS_DE_HISTORIA = 30;

  private static final List<MedicamentoRequest> CATALOGO =
      List.of(
          medicamento("AMOX-500", "Amoxicilina", "comprimidos 500 mg", 200),
          medicamento("CEFT-1G", "Ceftriaxona", "frasco ampolla 1 g", 80),
          medicamento("ENOX-40", "Enoxaparina", "jeringa prellenada 40 mg", 100),
          medicamento("SF-500", "Solución fisiológica 0,9 %", "sachet 500 ml", 300),
          medicamento("PARA-500", "Paracetamol", "comprimidos 500 mg", 300),
          medicamento("IBU-400", "Ibuprofeno", "comprimidos 400 mg", 200),
          medicamento("DIPI-1G", "Dipirona", "ampolla 1 g / 2 ml", 150),
          medicamento("OMEP-40", "Omeprazol", "frasco ampolla 40 mg", 80),
          medicamento("RANI-50", "Ranitidina", "ampolla 50 mg", 60),
          medicamento("METO-10", "Metoclopramida", "ampolla 10 mg", 80),
          medicamento("DEXA-8", "Dexametasona", "ampolla 8 mg", 60),
          medicamento("FURO-20", "Furosemida", "ampolla 20 mg", 80),
          medicamento("HEPA-5K", "Heparina sódica", "frasco ampolla 5000 UI/ml", 40),
          medicamento("INSU-100", "Insulina corriente", "frasco ampolla 100 UI/ml", 30),
          medicamento("RL-500", "Ringer lactato", "sachet 500 ml", 200),
          medicamento("DX5-500", "Dextrosa 5 %", "sachet 500 ml", 150),
          medicamento("AMIK-500", "Amikacina", "ampolla 500 mg", 60),
          medicamento("CLIN-600", "Clindamicina", "ampolla 600 mg", 60),
          medicamento("MIDA-15", "Midazolam", "ampolla 15 mg", 50),
          medicamento("KETO-30", "Ketorolac", "ampolla 30 mg", 100),
          medicamento("SALB-100", "Salbutamol", "aerosol 100 mcg", 40),
          medicamento("LIDO-2", "Lidocaína 2 %", "frasco ampolla 20 ml", 40),
          medicamento("DOPA-200", "Dopamina", "ampolla 200 mg", 20),
          medicamento("VANC-1G", "Vancomicina", "frasco ampolla 1 g", 30),
          medicamento("ADRE-1", "Adrenalina", "ampolla 1 mg", 50));

  // Índices dentro del catálogo según el estado que se quiere mostrar en las alertas.
  private static final int ULTIMO_NORMAL = 15;
  private static final List<Integer> CON_LOTES_POR_VENCER = List.of(0, 1, 2);
  private static final List<Integer> CON_STOCK_BAJO = List.of(16, 17, 18);
  private static final List<Integer> CON_LOTES_VENCIDOS = List.of(19, 20, 21);
  // 22, 23 y 24 quedan sin ningún lote: SIN_STOCK.

  private final MedicamentoRepository medicamentoRepository;
  private final MedicamentoService medicamentoService;
  private final ProveedorService proveedorService;
  private final ProveedorRepository proveedorRepository;
  private final AreaRepository areaRepository;
  private final UsuarioService usuarioService;
  private final UsuarioRepository usuarioRepository;
  private final LoteService loteService;
  private final LoteRepository loteRepository;
  private final MovimientoStockRepository movimientoRepository;
  private final TransferenciaService transferenciaService;
  private final PlatformTransactionManager transactionManager;
  private final FarmaciaProperties propiedades;
  private final RelojDemo reloj;

  @Override
  public void run(ApplicationArguments args) {
    if (medicamentoRepository.count() > 0) {
      return;
    }
    Usuario admin =
        usuarioRepository
            .findByUsername("admin")
            .orElseThrow(() -> new IllegalStateException("Falta el usuario admin."));
    // Los servicios toman el usuario del contexto de seguridad, como en un pedido real.
    SecurityContextHolder.getContext()
        .setAuthentication(
            UsernamePasswordAuthenticationToken.authenticated(
                admin.getId().toString(), null, List.of()));
    try {
      cargar(admin);
    } finally {
      reloj.volverAlPresente();
      SecurityContextHolder.clearContext();
    }
    log.info("Datos demo cargados");
  }

  private void cargar(Usuario admin) {
    Random azar = new Random(20261109L);
    crearUsuarios();
    List<Long> proveedores = crearProveedores();
    List<Long> medicamentos =
        CATALOGO.stream().map(pedido -> medicamentoService.crear(pedido).id()).toList();
    LocalDate hoy = LocalDate.now(reloj);

    reloj.retroceder(Duration.ofDays(DIAS_DE_HISTORIA));
    for (int i = 0; i <= ULTIMO_NORMAL; i++) {
      ingresar(medicamentos.get(i), proveedores, azar, hoy.plusDays(120 + azar.nextInt(280)), 400);
      ingresar(medicamentos.get(i), proveedores, azar, hoy.plusDays(400 + azar.nextInt(300)), 200);
    }
    for (int i = 0; i < CON_LOTES_POR_VENCER.size(); i++) {
      ingresar(
          medicamentos.get(CON_LOTES_POR_VENCER.get(i)),
          proveedores,
          azar,
          hoy.plusDays(7 + 9L * i),
          60);
    }
    for (int indice : CON_STOCK_BAJO) {
      int minimo = CATALOGO.get(indice).stockMinimo();
      ingresar(medicamentos.get(indice), proveedores, azar, hoy.plusDays(300), minimo / 3);
    }
    for (int indice : CON_LOTES_VENCIDOS) {
      ingresar(medicamentos.get(indice), proveedores, azar, hoy.plusDays(250), 150);
    }

    crearTransferencias(medicamentos, azar);
    reloj.volverAlPresente();

    for (int i = 0; i < CON_LOTES_VENCIDOS.size(); i++) {
      insertarLoteVencido(
          medicamentos.get(CON_LOTES_VENCIDOS.get(i)),
          proveedores.get(i),
          hoy.minusDays(3 + 8L * i),
          admin);
    }
  }

  private void crearUsuarios() {
    String password = propiedades.demo().password();
    if (!usuarioRepository.existsByUsername("farmaceutico")) {
      usuarioService.crear(
          new UsuarioRequest("farmaceutico", "María Farmacéutica", Rol.FARMACEUTICO, password));
    }
    if (!usuarioRepository.existsByUsername("consulta")) {
      usuarioService.crear(new UsuarioRequest("consulta", "Juan Consulta", Rol.CONSULTA, password));
    }
  }

  private List<Long> crearProveedores() {
    return List.of(
            new ProveedorRequest(
                "Droguería del Norte S.A.", "30-70111222-5", "0381 421-0000", "ventas@norte.test"),
            new ProveedorRequest(
                "Distribuidora Andina S.R.L.", "30-70333444-6", "0387 422-1111", null),
            new ProveedorRequest(
                "Laboratorios Tucumanos S.A.", "30-71555666-5", null, "pedidos@labtuc.test"),
            new ProveedorRequest(
                "Insumos Médicos del Centro S.A.", "30-69777888-4", "0351 423-2222", null))
        .stream()
        .map(pedido -> proveedorService.crear(pedido).id())
        .toList();
  }

  private void ingresar(
      Long medicamentoId,
      List<Long> proveedores,
      Random azar,
      LocalDate vencimiento,
      int cantidadMaxima) {
    int cantidad = Math.max(1, cantidadMaxima / 2 + azar.nextInt(cantidadMaxima / 2 + 1));
    String numeroLote = "L" + (10000 + azar.nextInt(90000));
    loteService.ingresar(
        medicamentoId,
        new IngresoRequest(
            proveedores.get(azar.nextInt(proveedores.size())), numeroLote, vencimiento, cantidad));
  }

  private void crearTransferencias(List<Long> medicamentos, Random azar) {
    List<Long> areas =
        areaRepository.findAll().stream().filter(Area::isActivo).map(Area::getId).toList();
    for (int dia = DIAS_DE_HISTORIA - 2; dia >= 6; dia -= 2) {
      reloj.retroceder(Duration.ofDays(dia).minusHours(azar.nextInt(8)));
      List<TransferenciaRequest.Item> items = new ArrayList<>();
      int cantidadItems = 1 + azar.nextInt(3);
      for (int i = 0; i < cantidadItems; i++) {
        // Solo medicamentos con stock holgado y sin lotes por vencer, para no gastar esos lotes.
        int indice = CON_LOTES_POR_VENCER.size() + azar.nextInt(ULTIMO_NORMAL - 2);
        items.add(new TransferenciaRequest.Item(medicamentos.get(indice), 10 + azar.nextInt(31)));
      }
      try {
        transferenciaService.transferir(
            new TransferenciaRequest(areas.get(azar.nextInt(areas.size())), null, items));
      } catch (StockInsuficienteException ex) {
        log.debug("Transferencia demo omitida: {}", ex.getMessage());
      }
    }
  }

  // El servicio de ingreso rechaza fechas pasadas, así que los lotes vencidos se insertan con el
  // repositorio, cada uno con su movimiento INGRESO.
  private void insertarLoteVencido(
      Long medicamentoId, Long proveedorId, LocalDate vencimiento, Usuario admin) {
    new TransactionTemplate(transactionManager)
        .executeWithoutResult(
            estado -> {
              LocalDate ingreso = vencimiento.minusDays(200);
              OffsetDateTime creadoEn = ingreso.atStartOfDay(reloj.getZone()).toOffsetDateTime();
              Lote lote =
                  loteRepository.save(
                      new Lote(
                          medicamentoRepository.getReferenceById(medicamentoId),
                          proveedorRepository.getReferenceById(proveedorId),
                          "V" + vencimiento.getDayOfYear() + medicamentoId,
                          vencimiento,
                          40,
                          ingreso,
                          usuarioRepository.getReferenceById(admin.getId()),
                          creadoEn));
              movimientoRepository.save(
                  MovimientoStock.ingreso(lote, creadoEn, lote.getRegistradoPor()));
            });
  }

  private static MedicamentoRequest medicamento(
      String codigo, String nombre, String presentacion, int stockMinimo) {
    return new MedicamentoRequest(codigo, nombre, presentacion, stockMinimo);
  }
}
