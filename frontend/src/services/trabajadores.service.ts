import api from './api';

export interface Trabajador {
  id: string;
  dni: string;
  nombreCompleto: string;
  cargo: string;
  tipoSangre?: string;
  telefonoEmergencia?: string;
  contactoEmergencia?: string;
  estadoEMO: 'APTO' | 'NO_APTO' | 'APTO_RESTRICCION';
  estadoLaboral: 'ACTIVO' | 'CESADO';
  fechaVencimientoEMO?: string;
  tallaCasco?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaCalzado?: string;
  tallaGuantes?: string;
  codigoQr?: string;
  fotoUrl?: string;
  alergiasCriticas?: string;
  condicionesPreexistentes?: string;
  eps?: string;
  arl?: string;
  fechaUltimoExamen?: string;
  fechaIngreso?: string;
  fechaNacimiento?: string;
  curp?: string;
  nss?: string;
  telefono?: string;
  correo?: string;
  turno?: string;
  nivelEducativo?: string;
  sucursalId: string;
  activo: boolean;
  creadoEn: string;
  sucursal?: { id: string; nombre: string };
  entregasEpp?: any[];
  capacitaciones?: any[];
  amonestaciones?: any[];
  inspecciones?: any[];
  _count?: {
    entregasEpp: number;
    capacitaciones: number;
    amonestaciones: number;
    inspecciones: number;
  };
}

// ── Enums HSE ────────────────────────────────────────────────
export type TipoInstalacion = 'OFICINA' | 'PLANTA_INDUSTRIAL' | 'ALMACEN' | 'LABORATORIO' | 'OBRA';
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type CategoriaIncendio = 'BAJO' | 'ORDINARIO' | 'ALTO';
export type ResultadoInspeccionSUNAFIL = 'CONFORME' | 'OBSERVADO' | 'NO_CONFORME' | 'SANCIONADO';

// ── Tipos para JSON fields ────────────────────────────────────
export interface BrigadaEmergencia {
  tipo: string;
  jefe: string;
  miembros: number;
  certificado: boolean;
}

export interface PeligroIdentificado {
  tipo: string;
  nivel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  zona: string;
  control: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  activa: boolean;
  creadoEn?: string;
  actualizadoEn?: string;

  // Clasificación
  tipoInstalacion?: TipoInstalacion;
  nivelRiesgo?: NivelRiesgo;
  categoriaIncendio?: CategoriaIncendio;

  // Datos legales
  codigoCIIU?: string;
  codigoEstablecimientoINDECI?: string;
  numeroCertificadoDC?: string;
  vencimientoCertificadoDC?: string;
  fechaProximaRevisionDC?: string;

  // Infraestructura física
  aforoMaximo?: number;
  areaM2?: number;
  numeroPisos?: number;
  anioConstruccion?: number;
  zonaRiesgoSismico?: number;

  // Gestión de emergencias
  responsableSSTNombre?: string;
  responsableSSTTelefono?: string;
  medicoOcupacionalNombre?: string;
  centroMedicoMasCercano?: string;
  telefonoCentroMedico?: string;
  cantidadExtintores?: number;
  tieneDesfibriladorDEA?: boolean;
  ubicacionDEA?: string;
  cantidadBotiquines?: number;
  tieneEnfermeria?: boolean;
  telefonoEmergenciasSede?: string;

  // Plan de emergencia
  planEmergenciaVigente?: boolean;
  fechaVencimientoPlanEmergencia?: string;
  fechaUltimoSimulacro?: string;
  cantidadSimulacrosAnio?: number;

  // JSONB
  brigadasEmergencia?: BrigadaEmergencia[] | null;
  peligrosIdentificados?: PeligroIdentificado[] | null;

  // Trazabilidad SUNAFIL
  fechaUltimaInspeccionSUNAFIL?: string;
  resultadoUltimaInspeccion?: ResultadoInspeccionSUNAFIL;
  observacionesLegalesActivas?: string;

  _count?: {
    trabajadores: number;
    inspecciones: number;
    amonestaciones: number;
    supervisores: number;
  };
}

export interface CrearSucursalData {
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
}

export interface CrearTrabajadorData {
  dni: string;
  nombreCompleto: string;
  cargo: string;
  sucursalId: string;
  tipoSangre?: string;
  telefonoEmergencia?: string;
  contactoEmergencia?: string;
  tallaCasco?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaCalzado?: string;
  tallaGuantes?: string;
  fotoBase64?: string;
  alergiasCriticas?: string;
  condicionesPreexistentes?: string;
  eps?: string;
  arl?: string;
  fechaUltimoExamen?: string;
  fechaIngreso?: string;
  fechaNacimiento?: string;
  curp?: string;
  nss?: string;
  telefono?: string;
  correo?: string;
  turno?: string;
  nivelEducativo?: string;
  estadoEMO?: 'APTO' | 'NO_APTO' | 'APTO_RESTRICCION';
  estadoLaboral?: 'ACTIVO' | 'CESADO';
  fechaVencimientoEMO?: string;
}

export interface PaginacionRespuesta<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export const trabajadoresService = {
  async obtenerTodos(busqueda?: string, sucursalId?: string, page: number = 1, limit: number = 20): Promise<PaginacionRespuesta<Trabajador>> {
    const params: any = { page, limit };
    if (busqueda) params.busqueda = busqueda;
    if (sucursalId) params.sucursalId = sucursalId;
    const { data } = await api.get<PaginacionRespuesta<Trabajador>>('/trabajadores', { params });
    return data;
  },

  async obtenerPorId(id: string): Promise<Trabajador> {
    const { data } = await api.get<Trabajador>(`/trabajadores/${id}`);
    return data;
  },

  async buscarPorQr(token: string): Promise<{ id: string }> {
    const { data } = await api.get<{id: string}>(`/trabajadores/qr/${token}`);
    return data;
  },

  async obtenerEmergencia(id: string): Promise<any> {
    const { data } = await api.get(`/trabajadores/${id}/emergencia`);
    return data;
  },

  async crear(datos: CrearTrabajadorData): Promise<Trabajador> {
    const { data } = await api.post<Trabajador>('/trabajadores', datos);
    return data;
  },

  async actualizar(id: string, datos: Partial<CrearTrabajadorData>): Promise<Trabajador> {
    const { data } = await api.put<Trabajador>(`/trabajadores/${id}`, datos);
    return data;
  },

  async desactivar(id: string): Promise<void> {
    await api.delete(`/trabajadores/${id}`);
  },

  async registrarEntregaEpp(trabajadorId: string, datos: any): Promise<any> {
    const { data } = await api.post(`/trabajadores/${trabajadorId}/epp`, datos);
    return data;
  },

  async registrarCapacitacion(trabajadorId: string, datos: any): Promise<any> {
    const { data } = await api.post(`/trabajadores/${trabajadorId}/capacitaciones`, datos);
    return data;
  },
};

export const sucursalesService = {
  async obtenerTodas(): Promise<Sucursal[]> {
    const { data } = await api.get<Sucursal[]>('/sucursales');
    return data;
  },
  
  async obtenerPorId(id: string): Promise<Sucursal> {
    const { data } = await api.get<Sucursal>(`/sucursales/${id}`);
    return data;
  },

  async crear(datos: CrearSucursalData): Promise<Sucursal> {
    const { data } = await api.post<Sucursal>('/sucursales', datos);
    return data;
  },

  async actualizar(id: string, datos: Partial<CrearSucursalData>): Promise<Sucursal> {
    const { data } = await api.put<Sucursal>(`/sucursales/${id}`, datos);
    return data;
  },

  async desactivar(id: string): Promise<void> {
    await api.delete(`/sucursales/${id}`);
  },
};
