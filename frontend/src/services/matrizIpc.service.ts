import api from './api';

export interface MatrizIpc {
  id: string;
  cargo: string;
  ubicacion: string;
  eppsObligatorios: string[];
  herramientasRequeridas: string[];
  capacitacionesRequeridas: string[];
  descripcion?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export type CrearMatrizIpc = Omit<MatrizIpc, 'id' | 'activo' | 'creadoEn' | 'actualizadoEn'>;

export const matrizIpcService = {
  async obtenerTodos(): Promise<MatrizIpc[]> {
    const { data } = await api.get<MatrizIpc[]>('/matriz-ipc');
    return data;
  },

  async obtenerPorId(id: string): Promise<MatrizIpc> {
    const { data } = await api.get<MatrizIpc>(`/matriz-ipc/${id}`);
    return data;
  },

  async crear(datos: CrearMatrizIpc): Promise<MatrizIpc> {
    const { data } = await api.post<MatrizIpc>('/matriz-ipc', datos);
    return data;
  },

  async actualizar(id: string, datos: Partial<CrearMatrizIpc>): Promise<MatrizIpc> {
    const { data } = await api.put<MatrizIpc>(`/matriz-ipc/${id}`, datos);
    return data;
  },

  async desactivar(id: string): Promise<void> {
    await api.delete(`/matriz-ipc/${id}`);
  },
};
