import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  describirDiasParaVencer,
  diasEntre,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  hoy,
  sumarDias,
} from './fechas';

describe('fechas', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra un LocalDate sin correrse un día', () => {
    expect(formatearFecha('2026-11-30')).toBe('30/11/2026');
    expect(formatearFecha('2027-01-01')).toBe('01/01/2027');
  });

  it('muestra un guion si no hay fecha', () => {
    expect(formatearFecha(null)).toBe('—');
  });

  it('rechaza un texto que no es aaaa-mm-dd', () => {
    expect(() => formatearFecha('30/11/2026')).toThrow();
  });

  it('calcula hoy en la hora de Argentina aunque en UTC ya sea mañana', () => {
    vi.useFakeTimers();
    // 02:00 UTC del 30/11 son las 23:00 del 29/11 en Argentina.
    vi.setSystemTime(new Date('2026-11-30T02:00:00Z'));
    expect(hoy()).toBe('2026-11-29');
  });

  it('suma y resta días cruzando meses y años', () => {
    expect(sumarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('cuenta los días para vencer', () => {
    expect(diasEntre('2026-11-09', '2026-11-21')).toBe(12);
    expect(diasEntre('2026-11-09', '2026-11-06')).toBe(-3);
    expect(diasEntre('2026-11-09', '2026-11-09')).toBe(0);
  });

  it('describe los días para vencer', () => {
    expect(describirDiasParaVencer(12)).toBe('Vence en 12 días');
    expect(describirDiasParaVencer(1)).toBe('Vence mañana');
    expect(describirDiasParaVencer(0)).toBe('Vence hoy');
    expect(describirDiasParaVencer(-1)).toBe('Venció ayer');
    expect(describirDiasParaVencer(-3)).toBe('Venció hace 3 días');
  });

  it('formatea instantes en la hora de Argentina', () => {
    expect(formatearFechaHora('2026-11-09T17:49:00-03:00')).toBe('09/11/2026 17:49');
    expect(formatearFechaHora('2026-11-10T01:15:00Z')).toBe('09/11/2026 22:15');
    expect(formatearHora('2026-11-10T01:15:00Z')).toBe('22:15');
  });
});
