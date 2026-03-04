import api from './api';

export type SeveridadFalta = 'LEVE' | 'GRAVE' | 'CRITICA';
export type EstadoInspeccion = 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';

export interface Amonestacion {
  id: string;
  trabajadorId: string;
  supervisorId: string;
  sucursalId: string;
  motivo: string;
  severidad: SeveridadFalta;
  descripcion: string;
  testimonios?: string;
  fechaEvento: string;
  creadoEn: string;
  trabajador?: { id: string; nombreCompleto: string; dni: string; cargo: string };
  supervisor?: { id: string; usuario: { nombreCompleto: string } };
  sucursal?: { id: string; nombre: string };
  fotos?: any[];
}

export interface CrearAmonestacionData {
  trabajadorId: string;
  supervisorId: string;
  sucursalId: string;
  motivo: string;
  severidad: SeveridadFalta;
  descripcion: string;
  testimonios?: string;
  fechaEvento: string;
}

export interface PaginacionRespuesta<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export const amonestacionesService = {
  async obtenerTodas(filtros?: { trabajadorId?: string; supervisorId?: string; sucursalId?: string; severidad?: string; page?: number; limit?: number }): Promise<PaginacionRespuesta<Amonestacion>> {
    const { data } = await api.get<PaginacionRespuesta<Amonestacion>>('/amonestaciones', { params: filtros });
    return data;
  },

  async obtenerPorId(id: string): Promise<Amonestacion> {
    const { data } = await api.get<Amonestacion>(`/amonestaciones/${id}`);
    return data;
  },

  async crear(datos: CrearAmonestacionData): Promise<Amonestacion> {
    const { data } = await api.post<Amonestacion>('/amonestaciones', datos);
    return data;
  },

  async estadisticas(): Promise<{ total: number; leves: number; graves: number; criticas: number }> {
    const { data } = await api.get('/amonestaciones/estadisticas');
    return data;
  },

  async estadisticasPorSucursal(): Promise<Array<{ sucursal: string; leves: number; graves: number; criticas: number; total: number }>> {
    const { data } = await api.get('/amonestaciones/estadisticas/por-sucursal');
    return data;
  },
};
