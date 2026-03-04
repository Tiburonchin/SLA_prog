import api from './api';

export interface SupervisorSucursal {
  id: string;
  sucursal: { id: string; nombre: string };
}

export interface Supervisor {
  id: string;
  telefono?: string;
  creadoEn: string;
  usuario: {
    id: string;
    correo: string;
    nombreCompleto: string;
    rol: string;
    activo: boolean;
  };
  sucursales: SupervisorSucursal[];
  _count?: {
    inspecciones: number;
    amonestaciones: number;
  };
}

export interface SupervisorDetalle extends Supervisor {
  usuario: Supervisor['usuario'] & { creadoEn: string };
  sucursales: Array<{
    id: string;
    sucursal: {
      id: string;
      nombre: string;
      direccion?: string;
      latitud?: number;
      longitud?: number;
      activa: boolean;
    };
  }>;
  inspecciones: Array<{
    id: string;
    tipoTrabajo: string;
    estado: string;
    creadoEn: string;
    sucursal: { nombre: string };
  }>;
  amonestaciones: Array<{
    id: string;
    motivo: string;
    severidad: string;
    fechaEvento: string;
    trabajador: { nombreCompleto: string; dni: string };
    sucursal: { nombre: string };
  }>;
}

export interface UsuarioDisponible {
  id: string;
  correo: string;
  nombreCompleto: string;
}

export const supervisoresService = {
  async obtenerTodos(busqueda?: string): Promise<Supervisor[]> {
    const params: any = {};
    if (busqueda) params.busqueda = busqueda;
    const { data } = await api.get<Supervisor[]>('/supervisores', { params });
    return data;
  },

  async obtenerPorId(id: string): Promise<SupervisorDetalle> {
    const { data } = await api.get<SupervisorDetalle>(`/supervisores/${id}`);
    return data;
  },

  async crear(datos: { usuarioId: string; telefono?: string; sucursalIds?: string[] }): Promise<Supervisor> {
    const { data } = await api.post<Supervisor>('/supervisores', datos);
    return data;
  },

  async actualizar(id: string, datos: { telefono?: string; sucursalIds?: string[] }): Promise<Supervisor> {
    const { data } = await api.put<Supervisor>(`/supervisores/${id}`, datos);
    return data;
  },

  async desactivar(id: string): Promise<void> {
    await api.delete(`/supervisores/${id}`);
  },

  async usuariosDisponibles(): Promise<UsuarioDisponible[]> {
    const { data } = await api.get<UsuarioDisponible[]>('/supervisores/usuarios-disponibles');
    return data;
  },
};
