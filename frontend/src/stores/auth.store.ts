import { create } from 'zustand';
import { authService, type UsuarioInfo, type LoginCredenciales } from '../services/auth.service';

interface AuthState {
  usuario: UsuarioInfo | null;
  token: string | null;
  cargando: boolean;
  error: string | null;

  login: (credenciales: LoginCredenciales) => Promise<void>;
  logout: () => void;
  cargarSesion: () => void;
  limpiarError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  token: null,
  cargando: false,
  error: null,

  login: async (credenciales) => {
    set({ cargando: true, error: null });
    try {
      const respuesta = await authService.login(credenciales);
      localStorage.setItem('hse_token', respuesta.token);
      localStorage.setItem('hse_usuario', JSON.stringify(respuesta.usuario));
      set({
        usuario: respuesta.usuario,
        token: respuesta.token,
        cargando: false,
      });
    } catch (err: any) {
      const mensaje =
        err.response?.data?.message || 'Error al iniciar sesión';
      set({ error: mensaje, cargando: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('hse_token');
    localStorage.removeItem('hse_usuario');
    set({ usuario: null, token: null });
  },

  cargarSesion: async () => {
    const token = localStorage.getItem('hse_token');
    const usuarioStr = localStorage.getItem('hse_usuario');
    if (token && usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        set({ usuario, token });
        
        // Verificar validez del token en el backend
        await authService.obtenerPerfil();
      } catch {
        localStorage.removeItem('hse_token');
        localStorage.removeItem('hse_usuario');
        set({ usuario: null, token: null });
      }
    }
  },

  limpiarError: () => set({ error: null }),
}));
