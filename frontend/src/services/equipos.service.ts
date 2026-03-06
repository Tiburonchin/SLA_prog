import api from './api';

export interface Equipo {
  id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  numeroSerie: string;
  nfcTagId?: string;
  estado: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'BAJA_TECNICA';
  descripcion?: string;
  creadoEn: string;
  calibraciones?: Calibracion[];
  _count?: { calibraciones: number };
}

export interface Calibracion {
  id: string;
  equipoId: string;
  fechaCalibracion: string;
  proximaCalibracion: string;
  certificadoUrl?: string;
  observaciones?: string;
  equipo?: { id: string; nombre: string };
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
