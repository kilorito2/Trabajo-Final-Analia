import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Trash2 } from 'lucide-react';
import { useAreasActivas } from '../../api/areas';
import { ErrorApi, mensajeDeError } from '../../api/errores';
import { useCrearTransferencia } from '../../api/transferencias';
import type { Medicamento } from '../../api/tipos';
import { useAvisos } from '../../components/Avisos';
import { BuscadorMedicamento } from '../../components/BuscadorMedicamento';
import { CampoFormulario } from '../../components/CampoFormulario';
import { Confirmacion } from '../../components/Confirmacion';
import { EncabezadoPagina } from '../../components/EncabezadoPagina';
import { Modal } from '../../components/Modal';
import { nombreCompleto } from '../../utils/medicamento';
import { formatearNumero } from '../../utils/numeros';
import { entero } from '../../utils/validaciones';
import {
  BORRADOR_VACIO,
  borrarBorrador,
  guardarBorrador,
  leerBorrador,
  type Borrador,
  type Linea,
} from './borrador';

const MAXIMO_OBSERVACIONES = 500;
const MAXIMO_ITEMS = 50;

type Faltante = { disponible: number; solicitado: number };

function sinClave<T>(registro: Record<number, T>, clave: number): Record<number, T> {
  const copia = { ...registro };
  delete copia[clave];
  return copia;
}

const errorDeLinea = (linea: Linea) => entero({ minimo: 1, maximo: linea.stock })(linea.cantidad);

export function PaginaNuevaTransferencia() {
  const navegar = useNavigate();
  const { avisar } = useAvisos();
  const areas = useAreasActivas();
  const crear = useCrearTransferencia();
  const enviando = useRef(false);

  const [borrador, setBorrador] = useState<Borrador>(leerBorrador);
  const [elegido, setElegido] = useState<Medicamento | null>(null);
  const [cantidadNueva, setCantidadNueva] = useState('');
  const [vueltaBuscador, setVueltaBuscador] = useState(0);
  const [erroresAgregar, setErroresAgregar] = useState<{ medicamento?: string; cantidad?: string }>({});
  const [errorArea, setErrorArea] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [lineasTocadas, setLineasTocadas] = useState<Set<number>>(new Set());
  const [intentoConfirmar, setIntentoConfirmar] = useState(false);
  const [faltantes, setFaltantes] = useState<Record<number, Faltante>>({});
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [descartando, setDescartando] = useState(false);

  useEffect(() => {
    guardarBorrador(borrador);
  }, [borrador]);

  const { areaId, lineas, observaciones } = borrador;
  const area = areas.data?.content.find((a) => String(a.id) === areaId);
  const tieneContenido = areaId !== '' || lineas.length > 0 || observaciones !== '';

  function actualizar(cambios: Partial<Borrador>) {
    setBorrador((actual) => ({ ...actual, ...cambios }));
  }

  function agregarLinea() {
    if (!elegido) {
      setErroresAgregar({ medicamento: 'Elegí un medicamento.' });
      return;
    }
    const nombre = nombreCompleto(elegido);
    const existente = lineas.find((l) => l.medicamentoId === elegido.id);
    const yaPedido = existente ? Number(existente.cantidad) || 0 : 0;
    const error = entero({ minimo: 1, maximo: Math.max(elegido.stockTotal - yaPedido, 0) })(cantidadNueva);
    if (error) {
      setErroresAgregar({
        cantidad: elegido.stockTotal - yaPedido <= 0 ? 'No queda stock disponible.' : error,
      });
      return;
    }
    if (!existente && lineas.length >= MAXIMO_ITEMS) {
      setErroresAgregar({ medicamento: `Una transferencia puede tener hasta ${MAXIMO_ITEMS} medicamentos.` });
      return;
    }

    if (existente) {
      actualizar({
        lineas: lineas.map((l) =>
          l.medicamentoId === elegido.id
            ? { ...l, stock: elegido.stockTotal, cantidad: String(yaPedido + Number(cantidadNueva)) }
            : l,
        ),
      });
      avisar('info', `Se sumó a la línea de ${nombre}.`);
    } else {
      actualizar({
        lineas: [
          ...lineas,
          {
            medicamentoId: elegido.id,
            nombre,
            stock: elegido.stockTotal,
            cantidad: String(Number(cantidadNueva)),
          },
        ],
      });
    }
    setElegido(null);
    setCantidadNueva('');
    setErroresAgregar({});
    setVueltaBuscador((n) => n + 1);
  }

  function cambiarCantidad(medicamentoId: number, cantidad: string) {
    actualizar({ lineas: lineas.map((l) => (l.medicamentoId === medicamentoId ? { ...l, cantidad } : l)) });
    setFaltantes((actuales) => sinClave(actuales, medicamentoId));
  }

  function quitarLinea(medicamentoId: number) {
    actualizar({ lineas: lineas.filter((l) => l.medicamentoId !== medicamentoId) });
    setFaltantes((actuales) => sinClave(actuales, medicamentoId));
  }

  function revisar() {
    setIntentoConfirmar(true);
    setErrorGeneral(null);
    const sinArea = !area;
    setErrorArea(sinArea ? 'Elegí el área de destino.' : null);
    if (lineas.length === 0) {
      setErroresAgregar({ medicamento: 'Agregá al menos un medicamento.' });
    }
    const lineasValidas = lineas.length > 0 && lineas.every((l) => errorDeLinea(l) === null);
    const observacionesValidas = observaciones.trim().length <= MAXIMO_OBSERVACIONES;
    if (!sinArea && lineasValidas && observacionesValidas) {
      crear.reset();
      setResumenAbierto(true);
    }
  }

  function confirmar() {
    // El ref corta el doble clic antes de que React vuelva a renderizar el botón deshabilitado.
    if (enviando.current || !area) return;
    enviando.current = true;
    crear.mutate(
      {
        areaId: area.id,
        observaciones: observaciones.trim() || null,
        items: lineas.map((l) => ({ medicamentoId: l.medicamentoId, cantidad: Number(l.cantidad) })),
      },
      {
        onSuccess: (transferencia) => {
          borrarBorrador();
          avisar('exito', `Se registró la transferencia ${transferencia.numero}.`);
          navegar(`/transferencias/${transferencia.id}`);
        },
        onError: (error) => {
          enviando.current = false;
          setResumenAbierto(false);
          setErrorGeneral(mensajeDeError(error));
          if (error instanceof ErrorApi && error.codigo === 'STOCK_INSUFICIENTE') {
            const nuevos: Record<number, Faltante> = {};
            for (const f of error.faltantes) nuevos[f.medicamentoId] = f;
            setFaltantes(nuevos);
            actualizar({
              lineas: lineas.map((l) => {
                const faltante = nuevos[l.medicamentoId];
                return faltante ? { ...l, stock: faltante.disponible } : l;
              }),
            });
          }
        },
      },
    );
  }

  function descartar() {
    borrarBorrador();
    setBorrador(BORRADOR_VACIO);
    setFaltantes({});
    setLineasTocadas(new Set());
    setIntentoConfirmar(false);
    setErrorArea(null);
    setErrorGeneral(null);
    setErroresAgregar({});
    setDescartando(false);
  }

  const largoObservaciones = observaciones.length;

  return (
    <>
      <EncabezadoPagina titulo="Nueva transferencia" />

      <div className="transferencia">
        {errorGeneral && (
          <p className="mensaje mensaje--peligro" role="alert">
            {errorGeneral}
          </p>
        )}

        <section
          className="tarjeta tarjeta--relleno formulario formulario--ancho"
          aria-labelledby="titulo-destino"
        >
          <h2 id="titulo-destino">Destino</h2>
          <CampoFormulario etiqueta="Área de destino" obligatorio error={errorArea}>
            {(props) => (
              <select
                {...props}
                className="control"
                value={areaId}
                onChange={(e) => {
                  actualizar({ areaId: e.target.value });
                  setErrorArea(null);
                }}
              >
                <option value="">{areas.isPending ? 'Cargando áreas…' : 'Elegí un área'}</option>
                {areas.data?.content.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            )}
          </CampoFormulario>
          {areas.isError && (
            <p className="mensaje mensaje--peligro" role="alert">
              {mensajeDeError(areas.error)}{' '}
              <button type="button" className="boton boton--chico" onClick={() => areas.refetch()}>
                Reintentar
              </button>
            </p>
          )}
        </section>

        <section className="tarjeta tarjeta--relleno" aria-labelledby="titulo-items">
          <h2 id="titulo-items">Medicamentos</h2>
          <div className="agregar-item">
            <BuscadorMedicamento
              key={vueltaBuscador}
              etiqueta="Medicamento"
              error={erroresAgregar.medicamento}
              ayuda={
                elegido
                  ? `Disponible: ${formatearNumero(elegido.stockTotal)}`
                  : 'Escribí el código o el nombre.'
              }
              alElegir={(medicamento) => {
                setElegido(medicamento);
                if (medicamento) setErroresAgregar({});
              }}
            />
            <CampoFormulario etiqueta="Cantidad a agregar" error={erroresAgregar.cantidad}>
              {(props) => (
                <input
                  {...props}
                  className="control control--numero"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={cantidadNueva}
                  onChange={(e) => setCantidadNueva(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarLinea();
                    }
                  }}
                />
              )}
            </CampoFormulario>
            <button type="button" className="boton agregar-item__boton" onClick={agregarLinea}>
              <Plus size={16} aria-hidden="true" />
              Agregar
            </button>
          </div>

          {lineas.length === 0 ? (
            <p className="texto-suave">Todavía no agregaste medicamentos.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <caption className="solo-lectores">Medicamentos a transferir</caption>
                <thead>
                  <tr>
                    <th scope="col">Medicamento</th>
                    <th scope="col" className="numero">
                      Disponible
                    </th>
                    <th scope="col" className="numero">
                      Cantidad
                    </th>
                    <th scope="col" className="numero">
                      Queda
                    </th>
                    <th scope="col">
                      <span className="solo-lectores">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea) => {
                    const faltante = faltantes[linea.medicamentoId];
                    const mostrarError = intentoConfirmar || lineasTocadas.has(linea.medicamentoId);
                    const error = faltante
                      ? `Disponible: ${formatearNumero(faltante.disponible)} (pediste ${formatearNumero(faltante.solicitado)})`
                      : mostrarError
                        ? errorDeLinea(linea)
                        : null;
                    const idError = `error-linea-${linea.medicamentoId}`;
                    const queda = linea.stock - (Number(linea.cantidad) || 0);
                    return (
                      <tr key={linea.medicamentoId}>
                        <td>{linea.nombre}</td>
                        <td className="numero">{formatearNumero(linea.stock)}</td>
                        <td className="numero">
                          <input
                            className="control control--numero control--en-tabla"
                            type="number"
                            min={1}
                            max={linea.stock}
                            step={1}
                            inputMode="numeric"
                            aria-label={`Cantidad de ${linea.nombre}`}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? idError : undefined}
                            value={linea.cantidad}
                            onChange={(e) => cambiarCantidad(linea.medicamentoId, e.target.value)}
                            onBlur={() =>
                              setLineasTocadas((actuales) => new Set(actuales).add(linea.medicamentoId))
                            }
                          />
                          {error && (
                            <span id={idError} className="campo__error linea__error">
                              {error}
                            </span>
                          )}
                        </td>
                        <td className="numero">{queda >= 0 ? formatearNumero(queda) : '—'}</td>
                        <td className="tabla__acciones">
                          <button
                            type="button"
                            className="boton-icono"
                            aria-label={`Quitar ${linea.nombre}`}
                            onClick={() => quitarLinea(linea.medicamentoId)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="tarjeta tarjeta--relleno formulario formulario--ancho"
          aria-labelledby="titulo-observaciones"
        >
          <h2 id="titulo-observaciones" className="solo-lectores">
            Observaciones
          </h2>
          <CampoFormulario
            etiqueta="Observaciones"
            ayuda={`${largoObservaciones} de ${MAXIMO_OBSERVACIONES} caracteres.`}
            error={
              largoObservaciones > MAXIMO_OBSERVACIONES
                ? `Puede tener hasta ${MAXIMO_OBSERVACIONES} caracteres.`
                : null
            }
          >
            {(props) => (
              <textarea
                {...props}
                className="control"
                value={observaciones}
                onChange={(e) => actualizar({ observaciones: e.target.value })}
              />
            )}
          </CampoFormulario>
        </section>

        <div className="formulario__acciones">
          <button type="button" className="boton boton--primario" onClick={revisar}>
            Revisar y confirmar
          </button>
          {tieneContenido && (
            <button type="button" className="boton" onClick={() => setDescartando(true)}>
              Descartar
            </button>
          )}
        </div>
      </div>

      <Modal
        abierto={resumenAbierto}
        ancho
        titulo="Confirmar la transferencia"
        alCerrar={() => setResumenAbierto(false)}
        bloqueado={crear.isPending}
        pie={
          <>
            <button
              type="button"
              className="boton"
              onClick={() => setResumenAbierto(false)}
              disabled={crear.isPending}
            >
              Volver
            </button>
            <button
              type="button"
              className="boton boton--primario"
              onClick={confirmar}
              disabled={crear.isPending}
            >
              {crear.isPending ? 'Registrando…' : 'Confirmar transferencia'}
            </button>
          </>
        }
      >
        <p>
          Destino: <strong>{area?.nombre}</strong>
        </p>
        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Resumen de la transferencia</caption>
            <thead>
              <tr>
                <th scope="col">Medicamento</th>
                <th scope="col" className="numero">
                  Cantidad
                </th>
                <th scope="col" className="numero">
                  Stock que queda
                </th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.medicamentoId}>
                  <td>{linea.nombre}</td>
                  <td className="numero">{formatearNumero(Number(linea.cantidad))}</td>
                  <td className="numero">{formatearNumero(linea.stock - Number(linea.cantidad))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {observaciones.trim() && <p>Observaciones: {observaciones.trim()}</p>}
      </Modal>

      <Confirmacion
        abierto={descartando}
        titulo="Descartar la transferencia"
        textoConfirmar="Descartar"
        peligro
        alConfirmar={descartar}
        alCancelar={() => setDescartando(false)}
      >
        <p>Se van a borrar el área, los medicamentos y las observaciones cargados.</p>
      </Confirmacion>
    </>
  );
}
