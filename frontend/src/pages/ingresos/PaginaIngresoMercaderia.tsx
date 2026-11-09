import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useResumen } from '../../api/alertas';
import { useMedicamento, useRegistrarIngreso } from '../../api/medicamentos';
import { useProveedoresActivos } from '../../api/proveedores';
import type { IngresoResponse, Medicamento } from '../../api/tipos';
import { BuscadorMedicamento } from '../../components/BuscadorMedicamento';
import { CampoFormulario } from '../../components/CampoFormulario';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { useFormulario } from '../../hooks/useFormulario';
import { diasEntre, formatearFecha, hoy } from '../../utils/fechas';
import { nombreCompleto } from '../../utils/medicamento';
import { formatearNumero } from '../../utils/numeros';
import { combinar, entero, longitudEntre, obligatorio } from '../../utils/validaciones';

type Elegido = Pick<Medicamento, 'id' | 'nombre' | 'presentacion'>;

const validaciones = {
  proveedorId: (valor: string) => (valor ? null : 'Elegí un proveedor.'),
  numeroLote: combinar(obligatorio, longitudEntre(1, 50)),
  fechaVencimiento: (valor: string) => {
    if (!valor) return 'Completá este campo.';
    return valor < hoy() ? 'La fecha de vencimiento no puede ser anterior a hoy.' : null;
  },
  cantidad: entero({ minimo: 1 }),
};

const VACIO = { proveedorId: '', numeroLote: '', fechaVencimiento: '', cantidad: '' };

function FormularioIngreso({ inicial }: { inicial: Elegido | null }) {
  const [medicamento, setMedicamento] = useState<Elegido | null>(inicial);
  const [errorMedicamento, setErrorMedicamento] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IngresoResponse | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const proveedores = useProveedoresActivos();
  const resumen = useResumen();
  const registrar = useRegistrarIngreso();
  const formulario = useFormulario(VACIO, validaciones);
  const { fechaVencimiento } = formulario.valores;

  const diasPorVencer = resumen.data?.diasPorVencer;
  const venceProximo =
    diasPorVencer !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento) &&
    fechaVencimiento >= hoy() &&
    diasEntre(hoy(), fechaVencimiento) <= diasPorVencer;

  function enviar() {
    const valido = formulario.validarTodo();
    setErrorMedicamento(medicamento ? null : 'Elegí un medicamento.');
    if (!valido || !medicamento) return;
    const { proveedorId, numeroLote, cantidad } = formulario.valores;
    registrar.mutate(
      {
        medicamentoId: medicamento.id,
        datos: {
          proveedorId: Number(proveedorId),
          numeroLote: numeroLote.trim(),
          fechaVencimiento,
          cantidad: Number(cantidad),
        },
      },
      { onSuccess: setResultado, onError: formulario.aplicarErrorServidor },
    );
  }

  function registrarOtro() {
    // Conserva el proveedor: suele llegar más de un lote en la misma entrega.
    formulario.reiniciar({ ...VACIO, proveedorId: formulario.valores.proveedorId });
    setResultado(null);
    setMedicamento(null);
    setVuelta((n) => n + 1);
    registrar.reset();
  }

  if (resultado) {
    return (
      <div className="tarjeta tarjeta--relleno resultado">
        <p className="mensaje mensaje--ok" role="status">
          Se registró el lote {resultado.lote.numeroLote}. Stock de {resultado.lote.medicamento}:{' '}
          {formatearNumero(resultado.stockTotalResultante)}.
        </p>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--primario" onClick={registrarOtro}>
            Registrar otro lote
          </button>
          <Link to={`/medicamentos/${resultado.lote.medicamentoId}`} className="boton">
            Ver el medicamento
          </Link>
        </div>
      </div>
    );
  }

  if (proveedores.isError) {
    return <ErrorCarga error={proveedores.error} alReintentar={() => proveedores.refetch()} />;
  }

  return (
    <form
      className="formulario tarjeta tarjeta--relleno"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      {formulario.errorGeneral && (
        <p className="mensaje mensaje--peligro" role="alert">
          {formulario.errorGeneral}
        </p>
      )}
      <BuscadorMedicamento
        key={vuelta}
        etiqueta="Medicamento"
        obligatorio
        textoInicial={medicamento ? nombreCompleto(medicamento) : ''}
        error={errorMedicamento}
        alElegir={(elegido) => {
          setMedicamento(elegido);
          if (elegido) setErrorMedicamento(null);
        }}
      />
      <CampoFormulario
        etiqueta="Proveedor"
        obligatorio
        ayuda={proveedores.data?.content.length === 0 ? 'No hay proveedores activos.' : undefined}
        error={formulario.errores.proveedorId}
      >
        {(props) => (
          <select {...props} className="control" {...formulario.registrar('proveedorId')}>
            <option value="">{proveedores.isPending ? 'Cargando proveedores…' : 'Elegí un proveedor'}</option>
            {proveedores.data?.content.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razonSocial}
              </option>
            ))}
          </select>
        )}
      </CampoFormulario>
      <CampoFormulario etiqueta="Número de lote" obligatorio error={formulario.errores.numeroLote}>
        {(props) => <input {...props} className="control" {...formulario.registrar('numeroLote')} />}
      </CampoFormulario>
      <CampoFormulario
        etiqueta="Fecha de vencimiento"
        obligatorio
        error={formulario.errores.fechaVencimiento}
      >
        {(props) => (
          <input
            {...props}
            className="control"
            type="date"
            min={hoy()}
            {...formulario.registrar('fechaVencimiento')}
          />
        )}
      </CampoFormulario>
      {venceProximo && (
        <p className="mensaje mensaje--aviso" role="status">
          Este lote vence el {formatearFecha(fechaVencimiento)}, dentro de los próximos {diasPorVencer} días.
          Podés registrarlo igual.
        </p>
      )}
      <CampoFormulario
        etiqueta="Cantidad"
        obligatorio
        ayuda="En unidades."
        error={formulario.errores.cantidad}
      >
        {(props) => (
          <input
            {...props}
            className="control control--numero"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            {...formulario.registrar('cantidad')}
          />
        )}
      </CampoFormulario>
      <div className="formulario__acciones">
        <button type="submit" className="boton boton--primario" disabled={registrar.isPending}>
          {registrar.isPending ? 'Registrando…' : 'Registrar ingreso'}
        </button>
      </div>
    </form>
  );
}

export function PaginaIngresoMercaderia() {
  const [parametros] = useSearchParams();
  const idParametro = Number(parametros.get('medicamentoId'));
  const idInicial = Number.isInteger(idParametro) && idParametro > 0 ? idParametro : null;
  const preelegido = useMedicamento(idInicial);

  return (
    <>
      <EncabezadoPagina titulo="Ingreso de mercadería" />
      {idInicial !== null && preelegido.isPending ? (
        <Cargando />
      ) : (
        <FormularioIngreso key={idInicial ?? 'nuevo'} inicial={preelegido.data ?? null} />
      )}
    </>
  );
}
