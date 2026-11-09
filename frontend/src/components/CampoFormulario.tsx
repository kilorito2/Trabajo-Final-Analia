import { useId, type ReactNode } from 'react';

type PropsControl = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  required: boolean;
};

type PropsCampo = {
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: string;
  error?: string | null;
  /** Recibe las props de accesibilidad para pasarlas al control (input, select, textarea). */
  children: (props: PropsControl) => ReactNode;
};

export function CampoFormulario({ etiqueta, obligatorio = false, ayuda, error, children }: PropsCampo) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descripciones = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ');

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta} {obligatorio && <span className="campo__obligatorio">(obligatorio)</span>}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': descripciones || undefined,
        required: obligatorio,
      })}
      {ayuda && (
        <span id={idAyuda} className="campo__ayuda">
          {ayuda}
        </span>
      )}
      {error && (
        <span id={idError} className="campo__error">
          {error}
        </span>
      )}
    </div>
  );
}
