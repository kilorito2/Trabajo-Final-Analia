package ar.edu.utn.farmacia.medicamento;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * Implementación de {@link MedicamentoConsultas}. Usa SQL porque el stock, el estado y el próximo
 * vencimiento salen de una agregación sobre los lotes (con :hoy como parámetro) y se filtra y
 * ordena por esos valores calculados.
 */
class MedicamentoConsultasImpl implements MedicamentoConsultas {

  private static final String DESDE =
      """
      from medicamento m
      left join (
          select l.medicamento_id,
                 sum(l.cantidad_actual) as stock,
                 min(l.fecha_vencimiento) as proximo
          from lote l
          where l.cantidad_actual > 0 and l.fecha_vencimiento >= :hoy
          group by l.medicamento_id
      ) s on s.medicamento_id = m.id
      """;

  private static final String COLUMNAS =
      """
      select m.id, m.codigo, m.nombre, m.presentacion, m.stock_minimo, m.activo,
             coalesce(s.stock, 0) as stock_total, s.proximo as proximo_vencimiento
      """;

  private static final Map<String, String> ORDEN =
      Map.of(
          "codigo", "m.codigo",
          "nombre", "m.nombre",
          "stockTotal", "coalesce(s.stock, 0)",
          "proximoVencimiento", "s.proximo");

  private final JdbcClient jdbcClient;

  MedicamentoConsultasImpl(DataSource dataSource) {
    this.jdbcClient = JdbcClient.create(dataSource);
  }

  @Override
  public Page<MedicamentoConStock> buscarConStock(
      FiltroMedicamentos filtro, LocalDate hoy, Pageable pagina) {
    Map<String, Object> parametros = new HashMap<>();
    parametros.put("hoy", hoy);
    String condiciones = condiciones(filtro, parametros);

    // Con GROUP BY adentro, el total se cuenta con una consulta propia.
    long total =
        jdbcClient
            .sql("select count(*) " + DESDE + condiciones)
            .params(parametros)
            .query(Long.class)
            .single();

    parametros.put("limite", pagina.getPageSize());
    parametros.put("desplazamiento", pagina.getOffset());
    List<MedicamentoConStock> contenido =
        jdbcClient
            .sql(
                COLUMNAS
                    + DESDE
                    + condiciones
                    + orden(pagina.getSort())
                    + " limit :limite offset :desplazamiento")
            .params(parametros)
            .query(MedicamentoConsultasImpl::fila)
            .list();
    return new PageImpl<>(contenido, pagina, total);
  }

  @Override
  public List<MedicamentoConStock> activosConStock(LocalDate hoy) {
    return jdbcClient
        .sql(COLUMNAS + DESDE + " where m.activo = true order by m.nombre, m.id")
        .param("hoy", hoy)
        .query(MedicamentoConsultasImpl::fila)
        .list();
  }

  private static String condiciones(FiltroMedicamentos filtro, Map<String, Object> parametros) {
    List<String> condiciones = new ArrayList<>();
    if (filtro.q() != null && !filtro.q().isBlank()) {
      condiciones.add("(m.codigo ilike :q escape '\\' or m.nombre ilike :q escape '\\')");
      parametros.put("q", "%" + escaparLike(filtro.q().strip()) + "%");
    }
    if (filtro.activo() != null) {
      condiciones.add("m.activo = :activo");
      parametros.put("activo", filtro.activo());
    }
    if (filtro.estado() != null) {
      condiciones.add(
          switch (filtro.estado()) {
            case SIN_STOCK -> "coalesce(s.stock, 0) = 0";
            case STOCK_BAJO ->
                "coalesce(s.stock, 0) > 0 and coalesce(s.stock, 0) <= m.stock_minimo";
            case OK -> "coalesce(s.stock, 0) > m.stock_minimo";
          });
    }
    return condiciones.isEmpty() ? "" : " where " + String.join(" and ", condiciones);
  }

  // Los nombres de columna salen de una lista blanca; el servicio ya rechazó cualquier otro campo.
  private static String orden(Sort sort) {
    List<String> criterios = new ArrayList<>();
    for (Sort.Order criterio : sort) {
      String columna = ORDEN.get(criterio.getProperty());
      if (columna != null) {
        criterios.add(columna + (criterio.isAscending() ? " asc" : " desc") + " nulls last");
      }
    }
    if (criterios.isEmpty()) {
      criterios.add("m.nombre asc");
    }
    criterios.add("m.id asc");
    return " order by " + String.join(", ", criterios);
  }

  private static String escaparLike(String texto) {
    return texto
        .toLowerCase(Locale.ROOT)
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_");
  }

  private static MedicamentoConStock fila(ResultSet rs, int numero) throws SQLException {
    return new MedicamentoConStock(
        rs.getLong("id"),
        rs.getString("codigo"),
        rs.getString("nombre"),
        rs.getString("presentacion"),
        rs.getInt("stock_minimo"),
        rs.getBoolean("activo"),
        rs.getLong("stock_total"),
        rs.getObject("proximo_vencimiento", LocalDate.class));
  }
}
