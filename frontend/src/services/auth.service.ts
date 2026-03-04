import api from './api';

export interface LoginCredenciales {
  correo: string;
  contrasena: string;
}

export interface RegistroData {
  correo: string;
  contrasena: string;
  nombreCompleto: string;
  rol: 'COORDINADOR' | 'SUPERVISOR' | 'JEFATURA';
}

export interface UsuarioInfo {
  id: string;
  correo: string;
  nombreCompleto: string;
  rol: string;
}

export interface AuthRespuesta {
  token: string;
  usuario: UsuarioInfo;
}

export const authService = {
  async login(credenciales: LoginCredenciales): Promise<AuthRespuesta> {
    const { data } = await api.post<AuthRespuesta>('/auth/login', credenciales);
    return data;
  },

  async registro(datos: RegistroData): Promise<AuthRespuesta> {
    const { data } = await api.post<AuthRespuesta>('/auth/registro', datos);
    return data;
  },

  async obtenerPerfil(): Promise<UsuarioInfo> {
    const { data } = await api.get<UsuarioInfo>('/usuarios/perfil');
    return data;
  },
};
