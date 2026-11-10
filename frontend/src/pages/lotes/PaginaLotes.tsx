import { useState } from 'react';
import { Link } from 'react-router';
import { useAjustarLote, useDarDeBajaLote, useLotes } from '../../api/lotes';
import type { EstadoLote, Lote } from '../../api/tipos';
import { useSesion } from '../../auth/SesionProvider';
import { useAvisos } from '../../components/Avisos';
import { CampoFormulario } from '../../components/CampoFormulario';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Insignia } from '../../components/Insignia';
import { Modal } from '../../components/Modal';
import { Paginador } from '../../components/Paginador';
import { Tabla, type Columna } from '../../components/Tabla';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { useFormulario } from '../../hooks/useFormulario';
import { describirEstadoLote } from '../../utils/estadoStock';
import { describirDiasParaVencer, formatearFecha } from '../../utils/fechas';
import { formatearNumero } from '../../utils/numeros';
import { combinar, entero, longitudEntre, obligatorio } from '../../utils/validaciones';

const VISTAS = {
  vencidos: { texto: 'Vencidos', estados: ['VENCIDO'] },
  'por-vencer': { texto: 'Por vencer', estados: ['POR_VENCER'] },
  todos: { texto: 'Todos con stock', estados: ['VIGENTE', 'POR_VENCER', 'VENCIDO'] },
} as const satisfies Record<string, { texto: string; estados: readonly EstadoLote[] }>;

type Vista = keyof typeof VISTAS;

/** Acepta `?vista=` y también `?estado=` (los enlaces del panel usan los valores del backend). */
function leerVista(filtros: ReturnType<typeof useFiltrosUrl>): Vista {
  const vista = filtros.leer('vista');
  if (vista === 'vencidos' || vista === 'por-vencer' || vista === 'todos') return vista;
  const estados = filtros.leerTodos('estado');
  if (estados.length === 1 && estados[0] === 'VENCIDO') return 'vencidos';
  if (estados.length === 1 && estados[0] === 'POR_VENCER') return 'por-vencer';
  return 'todos';
}

function ModalBaja({ lote, alCerrar }: { lote: Lote; alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const baja = useDarDeBajaLote();
  const formulario = useFormulario({ motivo: '' }, { motivo: combinar(obligatorio, longitudEntre(1, 200)) });

  function enviar() {
    if (!formulario.validarTodo()) return;
    baja.mutate(
      { id: lote.id, datos: { motivo: formulario.valores.motivo.trim() } },
      {
        onSuccess: () => {
          avisar(
            'exito',
            `Se dio de baja el lote ${lote.numeroLote} (${formatearNumero(lote.cantidadActual)} unidades).`,
          );
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo="Dar de baja por vencimiento"
      alCerrar={alCerrar}
      bloqueado={baja.isPending}
      pie={
        <>
          <button type="button" className="boton" onClick={alCerrar} disabled={baja.isPending}>
            Cancelar
          </button>
          <button
            type="submit"
            form="formulario-baja"
            className="boton boton--peligro"
            disabled={baja.isPending}
          >
            {baja.isPending ? 'Dando de baja…' : 'Dar de baja'}
          </button>
        </>
      }
    >
      <form
        id="formulario-baja"
        className="formulario"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <p>
          Lote {lote.numeroLote} de {lote.medicamento}, vencido el {formatearFecha(lote.fechaVencimiento)}. Se
          descuentan {formatearNumero(lote.cantidadActual)} unidades.
        </p>
        {formulario.errorGeneral && (
          <p className="mensaje mensaje--peligro" role="alert">
            {formulario.errorGeneral}
          </p>
        )}
        <CampoFormulario
          etiqueta="Motivo"
          obligatorio
          ayuda="Por ejemplo, destino del descarte o número de acta."
          error={formulario.errores.motivo}
        >
          {(props) => <textarea {...props} className="control" {...formulario.registrar('motivo')} />}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

function ModalAjuste({ lote, alCerrar }: { lote: Lote; alCerrar: () => void }) {
  const { avisar } = useAvisos();
  const ajustar = useAjustarLote();
  const formulario = useFormulario(
    { cantidadNueva: String(lote.cantidadActual), motivo: '' },
    {
      cantidadNueva: (valor: string) =>
        entero({ minimo: 0, maximo: lote.cantidadInicial })(valor) ??
        (Number(valor) === lote.cantidadActual ? 'Tiene que ser distinta de la cantidad actual.' : null),
      motivo: combinar(obligatorio, longitudEntre(5, 200)),
    },
  );

  function enviar() {
    if (!formulario.validarTodo()) return;
    ajustar.mutate(
      {
        id: lote.id,
        datos: {
          cantidadNueva: Number(formulario.valores.cantidadNueva),
          motivo: formulario.valores.motivo.trim(),
        },
      },
      {
        onSuccess: (actualizado) => {
          avisar(
            'exito',
            `Se ajustó el lote ${lote.numeroLote}: ahora tiene ${formatearNumero(actualizado.cantidadActual)} unidades.`,
          );
          alCerrar();
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
  }

  return (
    <Modal
      abierto
      titulo="Ajustar el lote"
      alCerrar={alCerrar}
      bloqueado={ajustar.isPending}
      pie={
        <>
          <button type="button" className="boton" onClick={alCerrar} disabled={ajustar.isPending}>
            Cancelar
          </button>
          <button
            type="submit"
            form="formulario-ajuste"
            className="boton boton--primario"
            disabled={ajustar.isPending}
          >
            {ajustar.isPending ? 'Guardando…' : 'Guardar ajuste'}
          </button>
        </>
      }
    >
      <form
        id="formulario-ajuste"
        className="formulario"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <p>
          Lote {lote.numeroLote} de {lote.medicamento}. Cantidad actual:{' '}
          {formatearNumero(lote.cantidadActual)} de {formatearNumero(lote.cantidadInicial)} ingresadas.
        </p>
        {formulario.errorGeneral && (
          <p className="mensaje mensaje--peligro" role="alert">
            {formulario.errorGeneral}
          </p>
        )}
        <CampoFormulario
          etiqueta="Cantidad nueva"
          obligatorio
          ayuda={`Entre 0 y ${formatearNumero(lote.cantidadInicial)}.`}
          error={formulario.errores.cantidadNueva}
        >
          {(props) => (
            <input
              {...props}
              className="control control--numero"
              type="number"
              min={0}
              max={lote.cantidadInicial}
              step={1}
              inputMode="numeric"
              {...formulario.registrar('cantidadNueva')}
            />
          )}
        </CampoFormulario>
        <CampoFormulario
          etiqueta="Motivo"
          obligatorio
          ayuda="Por ejemplo, rotura o diferencia de conteo (de 5 a 200 caracteres)."
          error={formulario.errores.motivo}
        >
          {(props) => <textarea {...props} className="control" {...formulario.registrar('motivo')} />}
        </CampoFormulario>
      </form>
    </Modal>
  );
}

export function PaginaLotes() {
  const filtros = useFiltrosUrl();
  const { puede } = useSesion();
  const puedeOperar = puede('STOCK_BAJA_AJUSTE');
  const vista = leerVista(filtros);
  const [dandoDeBaja, setDandoDeBaja] = useState<Lote | null>(null);
  const [ajustando, setAjustando] = useState<Lote | null>(null);

  const consulta = useLotes({
    estado: VISTAS[vista].estados,
    page: filtros.pagina,
    sort: filtros.ordenApi ?? 'fechaVencimiento,asc',
  });

  const columnas: Columna<Lote>[] = [
    {
      clave: 'medicamento',
      encabezado: 'Medicamento',
      celda: (l) => <Link to={`/medicamentos/${l.medicamentoId}`}>{l.medicamento}</Link>,
    },
    { clave: 'lote', encabezado: 'Lote', celda: (l) => l.numeroLote },
    { clave: 'proveedor', encabezado: 'Proveedor', celda: (l) => l.proveedor },
    {
      clave: 'vencimiento',
      encabezado: 'Vencimiento',
      campoOrden: 'fechaVencimiento',
      sinCortar: true,
      celda: (l) => formatearFecha(l.fechaVencimiento),
    },
    {
      clave: 'dias',
      encabezado: 'Días',
      celda: (l) => describirDiasParaVencer(l.diasParaVencer),
    },
    {
      clave: 'cantidad',
      encabezado: 'Cantidad',
      numero: true,
      celda: (l) => formatearNumero(l.cantidadActual),
    },
    { clave: 'estado', encabezado: 'Estado', celda: (l) => <Insignia {...describirEstadoLote(l.estado)} /> },
  ];
  if (puedeOperar) {
    columnas.push({
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      celda: (l) => (
        <div className="tabla__acciones">
          {l.estado === 'VENCIDO' && (
            <button
              type="button"
              className="boton boton--chico boton--texto"
              onClick={() => setDandoDeBaja(l)}
            >
              Dar de baja
              <span className="solo-lectores"> por vencimiento el lote {l.numeroLote}</span>
            </button>
          )}
          <button type="button" className="boton boton--chico boton--texto" onClick={() => setAjustando(l)}>
            Ajustar<span className="solo-lectores"> el lote {l.numeroLote}</span>
          </button>
        </div>
      ),
    });
  }

  const vacios: Record<Vista, string> = {
    vencidos: 'No hay lotes vencidos con stock.',
    'por-vencer': 'No hay lotes por vencer.',
    todos: 'No hay lotes con stock.',
  };

  return (
    <>
      <EncabezadoPagina titulo="Lotes y vencimientos" />
      <div className="filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-vista">
            Mostrar
          </label>
          <select
            id="filtro-vista"
            className="control"
            value={vista}
            onChange={(e) => filtros.actualizar({ vista: e.target.value, estado: null })}
          >
            {Object.entries(VISTAS).map(([valor, { texto }]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Tabla
        titulo="Lotes"
        columnas={columnas}
        filas={consulta.data?.content}
        claveFila={(l) => l.id}
        cargando={consulta.isPending}
        error={consulta.error}
        alReintentar={() => consulta.refetch()}
        vacio={vacios[vista]}
        orden={filtros.orden ?? { campo: 'fechaVencimiento', direccion: 'asc' }}
        alOrdenar={filtros.ordenar}
      />
      {consulta.data && <Paginador pagina={consulta.data.page} alCambiar={filtros.irAPagina} />}

      {dandoDeBaja && <ModalBaja lote={dandoDeBaja} alCerrar={() => setDandoDeBaja(null)} />}
      {ajustando && <ModalAjuste lote={ajustando} alCerrar={() => setAjustando(null)} />}
    </>
  );
}
