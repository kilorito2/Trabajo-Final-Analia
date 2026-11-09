package ar.edu.utn.farmacia.demo;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

/**
 * Reloj del perfil demo. Permite mover "ahora" hacia atrás mientras se cargan los datos, para que
 * las transferencias de ejemplo queden repartidas en los últimos 30 días pasando por los mismos
 * servicios que usa la API. Al terminar la carga vuelve a la hora real.
 */
public class RelojDemo extends Clock {

  private final Clock base;
  private volatile Duration desfase = Duration.ZERO;

  RelojDemo(ZoneId zona) {
    this.base = Clock.system(zona);
  }

  void retroceder(Duration cuanto) {
    this.desfase = cuanto.negated();
  }

  void volverAlPresente() {
    this.desfase = Duration.ZERO;
  }

  @Override
  public ZoneId getZone() {
    return base.getZone();
  }

  @Override
  public Clock withZone(ZoneId zona) {
    return Clock.offset(base.withZone(zona), desfase);
  }

  @Override
  public Instant instant() {
    return base.instant().plus(desfase);
  }
}
