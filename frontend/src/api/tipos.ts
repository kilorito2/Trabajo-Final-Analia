import type { components } from './esquema';

// Único archivo que nombra los esquemas generados. Si el backend cambia un nombre,
// se corrige acá y el resto del código no se entera.
type Esquemas = components['schemas'];

export type Rol = Esquemas['Rol'];
export type Permiso = Esquemas['Permiso'];
export type EstadoStock = Esquemas['EstadoStock'];
export type EstadoLote = Esquemas['EstadoLote'];
export type TipoMovimiento = Esquemas['TipoMovimiento'];
export type MetadatosPagina = Esquemas['PageMetadata'];

export type LoginRequest = Esquemas['LoginRequest'];
export type LoginResponse = Esquemas['LoginResponse'];
export type UsuarioSesion = Esquemas['UsuarioSesion'];
export type CambioPasswordRequest = Esquemas['CambioPasswordRequest'];
export type SolicitudRecuperacionRequest = Esquemas['SolicitudRecuperacionRequest'];
export type SolicitudRecuperacionResponse = Esquemas['SolicitudRecuperacionResponse'];
export type ConfirmacionRecuperacionRequest = Esquemas['ConfirmacionRecuperacionRequest'];
export type FormatoReporte = Esquemas['FormatoReporte'];

export type Usuario = Esquemas['UsuarioResponse'];
export type UsuarioRequest = Esquemas['UsuarioRequest'];
export type UsuarioEdicionRequest = Esquemas['UsuarioEdicionRequest'];
export type PaginaUsuarios = Esquemas['PagedModelUsuarioResponse'];

export type Proveedor = Esquemas['ProveedorResponse'];
export type ProveedorRequest = Esquemas['ProveedorRequest'];
export type PaginaProveedores = Esquemas['PagedModelProveedorResponse'];

export type Area = Esquemas['AreaResponse'];
export type AreaRequest = Esquemas['AreaRequest'];
export type PaginaAreas = Esquemas['PagedModelAreaResponse'];

export type Medicamento = Esquemas['MedicamentoResponse'];
export type MedicamentoDetalle = Esquemas['MedicamentoDetalleResponse'];
export type MedicamentoRequest = Esquemas['MedicamentoRequest'];
export type PaginaMedicamentos = Esquemas['PagedModelMedicamentoResponse'];

export type Lote = Esquemas['LoteResponse'];
export type PaginaLotes = Esquemas['PagedModelLoteResponse'];
export type IngresoRequest = Esquemas['IngresoRequest'];
export type IngresoResponse = Esquemas['IngresoResponse'];
export type BajaLoteRequest = Esquemas['BajaLoteRequest'];
export type AjusteLoteRequest = Esquemas['AjusteLoteRequest'];

export type Movimiento = Esquemas['MovimientoResponse'];
export type PaginaMovimientos = Esquemas['PagedModelMovimientoResponse'];

export type TransferenciaRequest = Esquemas['TransferenciaRequest'];
export type Transferencia = Esquemas['TransferenciaResponse'];
export type TransferenciaResumen = Esquemas['TransferenciaResumen'];
export type PaginaTransferencias = Esquemas['PagedModelTransferenciaResumen'];

export type Alertas = Esquemas['AlertasResponse'];
export type AlertaLote = Esquemas['AlertaLote'];
export type AlertaMedicamento = Esquemas['AlertaMedicamento'];
export type Resumen = Esquemas['ResumenResponse'];
