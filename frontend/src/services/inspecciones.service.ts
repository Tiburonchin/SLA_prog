import api from './api';

export type EstadoInspeccion = 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';

export interface ItemChecklist {
  descripcion: string;
  aprobado: boolean;
  observacion?: string;
}

export interface Inspeccion {
  id: string;
  supervisorId: string;
  sucursalId: string;
  ubicacion: string;
  tipoTrabajo: string;
  estado: EstadoInspeccion;
  checklist: ItemChecklist[];
  observaciones?: string;
  firmaSupervisor: boolean;
  firmaBase64?: string;
  latitudCierre?: number;
  longitudCierre?: number;
  fechaCierre?: string;
  creadoEn: string;
  supervisor?: { id: string; usuario: { nombreCompleto: string } };
  sucursal?: { id: string; nombre: string };
  fotos?: any[];
  trabajadores?: Array<{ trabajador: { id: string; nombreCompleto: string; dni: string; cargo: string } }>;
}

export interface CrearInspeccionData {
  supervisorId: string;
  sucursalId: string;
  ubicacion: string;
  tipoTrabajo: string;
  checklist?: ItemChecklist[];
  observaciones?: string;
  trabajadorIds?: string[];
}

export interface PaginacionRespuesta<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export const inspeccionesService = {
  async obtenerTodas(filtros?: { supervisorId?: string; sucursalId?: string; estado?: string; page?: number; limit?: number }): Promise<PaginacionRespuesta<Inspeccion>> {
    const { data } = await api.get<PaginacionRespuesta<Inspeccion>>('/inspecciones', { params: filtros });
    return data;
  },

  async obtenerPorId(id: string): Promise<Inspeccion> {
    const { data } = await api.get<Inspeccion>(`/inspecciones/${id}`);
    return data;
  },

  async crear(datos: CrearInspeccionData): Promise<Inspeccion> {
    const { data } = await api.post<Inspeccion>('/inspecciones', datos);
    return data;
  },

  async actualizarChecklist(id: string, checklist: ItemChecklist[], observaciones?: string): Promise<Inspeccion> {
    const { data } = await api.put<Inspeccion>(`/inspecciones/${id}/checklist`, { checklist, observaciones });
    return data;
  },

  async cerrar(id: string, coords?: { latitudCierre?: number; longitudCierre?: number; firmaBase64?: string }): Promise<Inspeccion> {
    const { data } = await api.post<Inspeccion>(`/inspecciones/${id}/cerrar`, coords || {});
    return data;
  },

  async estadisticas(): Promise<{ total: number; enProgreso: number; completadas: number; canceladas: number }> {
    const { data } = await api.get('/inspecciones/estadisticas');
    return data;
  },
};
