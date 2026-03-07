import api from './api';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TipoEquipo = 'MAQUINARIA_PESADA' | 'HERRAMIENTA_PODER' | 'EQUIPO_MEDICION' | 'VEHICULO' | 'EQUIPO_PRESION' | 'HERRAMIENTA_MENOR';
export type EstadoAutorizacion = 'PENDIENTE' | 'AUTORIZADO' | 'SUSPENDIDO' | 'REVOCADO';
export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO' | 'OVERHAUL';
export type EstadoCalibracion = 'CONFORME' | 'NO_CONFORME' | 'CONDICIONADO';
export type EstadoLoto = 'BLOQUEADO' | 'DESBLOQUEADO' | 'INCIDENCIA';

// ─── Related models ───────────────────────────────────────────────────────────
export interface AutorizacionOperador {
  id: string;
  trabajadorId: string;
  equipoId: string;
  capacitacionRequerida: string;
  capacitacionVerificada: boolean;
  emoVigenteVerificado: boolean;
  eppVerificado: boolean;
  estado: EstadoAutorizacion;
  fechaVencimiento?: string;
  autorizadoPorId?: string;
  observaciones?: string;
  creadoEn: string;
  trabajador: { id: string; nombreCompleto: string; dni: string };
}

export interface Mantenimiento {
  id: string;
  equipoId: string;
  tipoMantenimiento: TipoMantenimiento;
  fechaMantenimiento: string;
  proximoMantenimiento?: string;
  tecnicoResponsable: string;
  proveedorServicio?: string;
  trabajoRealizado: string;
  repuestosUsados?: string;
  horasEquipoAlMomento?: number;
  costoSoles?: number;
  equipoFueraServicio: boolean;
  certificadoUrl?: string;
  observaciones?: string;
  creadoEn: string;
}

export interface EjecucionLoto {
  id: string;
  equipoId: string;
  trabajadorId: string;
  motivoBloqueo: string;
  autorizadoPorId?: string;
  fechaBloqueo: string;
  fechaDesbloqueo?: string;
  listaVerificacion: { paso: string; verificado: boolean }[];
  estadoEjecucion: EstadoLoto;
  observaciones?: string;
  creadoEn: string;
}

export interface Calibracion {
  id: string;
  equipoId: string;
  fechaCalibracion: string;
  proximaCalibracion: string;
  certificadoUrl?: string;
  observaciones?: string;
  entidadCertificadora?: string;
  numeroCertificado?: string;
  estadoResultado?: EstadoCalibracion;
  equipo?: { id: string; nombre: string };
}

export interface EppObligatorioItem {
  tipo: string;
  especificacion?: string;
  obligatorio: boolean;
}

export interface Equipo {
  id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  numeroSerie: string;
  nfcTagId?: string;
  estado: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'BAJA_TECNICA';
  descripcion?: string;
  manualUrl?: string;
  creadoEn: string;
  // SINERGIA — Ciclo de vida
  sucursalId?: string;
  ubicacionFisica?: string;
  tipoEquipo?: TipoEquipo;
  fechaFabricacion?: string;
  fechaAdquisicion?: string;
  vidaUtilMeses?: number;
  proximoMantenimiento?: string;
  horasOperadasActuales?: number;
  horasLimiteMantenimiento?: number;
  // LOTO
  requiereLoto: boolean;
  puntosBloqueo?: string;
  energiasPeligrosas?: string[];
  eppObligatorio?: EppObligatorioItem[];
  // Relations
  sucursal?: { id: string; nombre: string };
  calibraciones?: Calibracion[];
  mantenimientos?: Mantenimiento[];
  autorizaciones?: AutorizacionOperador[];
  ejecucionesLoto?: EjecucionLoto[];
  inspecciones?: { id: string; tipoInspeccion?: string; resultado?: string; creadoEn: string }[];
  _count?: { calibraciones: number; mantenimientos: number; autorizaciones: number };
}

export const equiposService = {
  async obtenerTodos(busqueda?: string, estado?: string): Promise<Equipo[]> {
    const params: any = {};
    if (busqueda) params.busqueda = busqueda;
    if (estado) params.estado = estado;
    const { data } = await api.get<Equipo[]>('/equipos', { params });
    return data;
  },

  async obtenerPorId(id: string): Promise<Equipo> {
    const { data } = await api.get<Equipo>(`/equipos/${id}`);
    return data;
  },

  async obtenerPorNfc(tagId: string): Promise<Equipo> {
    const { data } = await api.get<Equipo>(`/equipos/nfc/${tagId}`);
    return data;
  },

  async crear(datos: Partial<Equipo>): Promise<Equipo> {
    const { data } = await api.post<Equipo>('/equipos', datos);
    return data;
  },

  async actualizar(id: string, datos: Partial<Equipo>): Promise<Equipo> {
    const { data } = await api.put<Equipo>(`/equipos/${id}`, datos);
    return data;
  },

  async agregarCalibracion(datos: { equipoId: string; fechaCalibracion: string; proximaCalibracion: string; observaciones?: string }): Promise<void> {
    await api.post('/equipos/calibraciones', datos);
  },

  async desactivar(id: string): Promise<void> {
    await api.delete(`/equipos/${id}`);
  },

  async calibracionesPorVencer(): Promise<Calibracion[]> {
    const { data } = await api.get<Calibracion[]>('/equipos/calibraciones/por-vencer');
    return data;
  },
};
