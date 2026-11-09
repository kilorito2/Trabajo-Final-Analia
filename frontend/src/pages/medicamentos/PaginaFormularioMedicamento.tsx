import { Link, useNavigate, useParams } from 'react-router';
import { useGuardarMedicamento, useMedicamento } from '../../api/medicamentos';
import type { MedicamentoDetalle } from '../../api/tipos';
import { useAvisos } from '../../components/Avisos';
import { CampoFormulario } from '../../components/CampoFormulario';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { useFormulario } from '../../hooks/useFormulario';
import { nombreCompleto } from '../../utils/medicamento';
import { combinar, entero, longitudEntre, obligatorio } from '../../utils/validaciones';

const validaciones = {
  codigo: combinar(obligatorio, longitudEntre(1, 30)),
  nombre: combinar(obligatorio, longitudEntre(1, 150)),
  presentacion: combinar(obligatorio, longitudEntre(1, 100)),
  stockMinimo: entero({ minimo: 0 }),
};

function Formulario({ medicamento }: { medicamento: MedicamentoDetalle | null }) {
  const navegar = useNavigate();
  const { avisar } = useAvisos();
  const guardar = useGuardarMedicamento();
  const formulario = useFormulario(
    {
      codigo: medicamento?.codigo ?? '',
      nombre: medicamento?.nombre ?? '',
      presentacion: medicamento?.presentacion ?? '',
      stockMinimo: medicamento ? String(medicamento.stockMinimo) : '',
    },
    validaciones,
  );
  const volverA = medicamento ? `/medicamentos/${medicamento.id}` : '/medicamentos';

  function enviar() {
    if (!formulario.validarTodo()) return;
    const { codigo, nombre, presentacion, stockMinimo } = formulario.valores;
    guardar.mutate(
      {
        id: medicamento?.id,
        datos: {
          codigo: codigo.trim(),
          nombre: nombre.trim(),
          presentacion: presentacion.trim(),
          stockMinimo: Number(stockMinimo),
        },
      },
      {
        onSuccess: (guardado) => {
          avisar('exito', `Se guardó ${nombreCompleto(guardado)}.`);
          navegar(`/medicamentos/${guardado.id}`);
        },
        onError: formulario.aplicarErrorServidor,
      },
    );
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
      <CampoFormulario etiqueta="Código" obligatorio error={formulario.errores.codigo}>
        {(props) => <input {...props} className="control" {...formulario.registrar('codigo')} />}
      </CampoFormulario>
      <CampoFormulario
        etiqueta="Nombre"
        obligatorio
        ayuda="Nombre genérico, sin marca comercial."
        error={formulario.errores.nombre}
      >
        {(props) => <input {...props} className="control" {...formulario.registrar('nombre')} />}
      </CampoFormulario>
      <CampoFormulario
        etiqueta="Presentación"
        obligatorio
        ayuda='Por ejemplo, "comprimidos 500 mg".'
        error={formulario.errores.presentacion}
      >
        {(props) => <input {...props} className="control" {...formulario.registrar('presentacion')} />}
      </CampoFormulario>
      <CampoFormulario
        etiqueta="Stock mínimo"
        obligatorio
        ayuda="Por debajo de este número el medicamento aparece con stock bajo."
        error={formulario.errores.stockMinimo}
      >
        {(props) => (
          <input
            {...props}
            className="control control--numero"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            {...formulario.registrar('stockMinimo')}
          />
        )}
      </CampoFormulario>
      <div className="formulario__acciones">
        <button type="submit" className="boton boton--primario" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : 'Guardar'}
        </button>
        <Link to={volverA} className="boton">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export function PaginaFormularioMedicamento() {
  const { id } = useParams();
  const idNumerico = id ? Number(id) : null;
  const consulta = useMedicamento(idNumerico);

  if (idNumerico === null) {
    return (
      <>
        <EncabezadoPagina titulo="Nuevo medicamento" />
        <Formulario medicamento={null} />
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina titulo="Editar medicamento" />
      {consulta.isPending && <Cargando />}
      {consulta.isError && <ErrorCarga error={consulta.error} alReintentar={() => consulta.refetch()} />}
      {consulta.data && <Formulario key={consulta.data.id} medicamento={consulta.data} />}
    </>
  );
}
