import type { Tono } from '../utils/estadoStock';

type PropsInsignia = {
  /** Siempre una palabra: el estado nunca se comunica solo con color. */
  texto: string;
  tono: Tono;
};

export function Insignia({ texto, tono }: PropsInsignia) {
  return <span className={`insignia insignia--${tono}`}>{texto}</span>;
}
