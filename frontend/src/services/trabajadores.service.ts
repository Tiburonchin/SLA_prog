import api from './api';

export interface Trabajador {
  id: string;
  dni: string;
  nombreCompleto: string;
  cargo: string;
  tipoSangre?: string;
  telefonoEmergencia?: string;
  contactoEmergencia?: string;
  estadoSalud: 'APTO' | 'NO_APTO' | 'APTO_CON_RESTRICCIONES';
  tallaCasco?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaCalzado?: string;
  tallaGuantes?: string;
  codigoQr?: string;
  fotoUrl?: string;
  alergias?: string;
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

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  activa: boolean;
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
  estadoSalud?: string;
  tallaCasco?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaCalzado?: string;
  tallaGuantes?: string;
  fotoBase64?: string;
  alergias?: string;
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
