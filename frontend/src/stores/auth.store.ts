import { create } from 'zustand';
import { authService, type UsuarioInfo, type LoginCredenciales } from '../services/auth.service';

interface AuthState {
  usuario: UsuarioInfo | null;
  token: string | null;
  cargando: boolean;
  inicializando: boolean;  // true mientras cargarSesion verifica la sesión inicial
  error: string | null;

  login: (credenciales: LoginCredenciales) => Promise<void>;
  logout: () => void;
  cargarSesion: () => Promise<void>;
  limpiarError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  token: null,
  cargando: false,
  inicializando: true,  // arranca true; se pone false cuando cargarSesion termina
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
        // Verificar que el token siga siendo válido en el backend
        await authService.obtenerPerfil();
      } catch {
        localStorage.removeItem('hse_token');
        localStorage.removeItem('hse_usuario');
        set({ usuario: null, token: null });
      }
    }
    // Siempre marcar la inicialización como completa
    set({ inicializando: false });
  },

  limpiarError: () => set({ error: null }),
}));
