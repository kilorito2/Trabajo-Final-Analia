import { FileSpreadsheet, FileText } from 'lucide-react';
import type { FormatoReporte } from '../api/tipos';
import { useDescarga } from '../hooks/useDescarga';

type PropsBotonesExportar = {
  /** Qué se exporta, para lectores de pantalla: "Exportar {que} a Excel". */
  que: string;
  exportar: (formato: FormatoReporte) => Promise<void>;
};

/** Botones Excel y PDF. El archivo trae todo lo filtrado, no solo la página visible. */
export function BotonesExportar({ que, exportar }: PropsBotonesExportar) {
  const descarga = useDescarga();
  const ocupado = descarga.enCurso !== null;

  return (
    <div className="botones-exportar">
      <button
        type="button"
        className="boton"
        disabled={ocupado}
        onClick={() => void descarga.descargar('XLSX', () => exportar('XLSX'))}
      >
        <FileSpreadsheet size={16} aria-hidden="true" />
        {descarga.enCurso === 'XLSX' ? 'Descargando…' : 'Excel'}
        <span className="solo-lectores"> (exportar {que})</span>
      </button>
      <button
        type="button"
        className="boton"
        disabled={ocupado}
        onClick={() => void descarga.descargar('PDF', () => exportar('PDF'))}
      >
        <FileText size={16} aria-hidden="true" />
        {descarga.enCurso === 'PDF' ? 'Descargando…' : 'PDF'}
        <span className="solo-lectores"> (exportar {que})</span>
      </button>
    </div>
  );
}
