import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';

export default function PaginaLogin() {
  const navigate = useNavigate();
  const { login, cargando, error, limpiarError, usuario, inicializando } = useAuthStore();

  // Hooks deben declararse siempre (antes de cualquier return condicional)
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  // Si ya hay sesión activa redirigir directo al dashboard
  if (!inicializando && usuario) {
    return <Navigate to="/" replace />;
  }

  // Mientras se verifica la sesión guardada, mostrar spinner
  if (inicializando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-fondo-principal)' }}
      >
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const correoLimpio = correo.toLowerCase().trim();
      const contrasenaLimpia = contrasena.trim();
      await login({ correo: correoLimpio, contrasena: contrasenaLimpia });
      navigate('/');
    } catch {
      // El error ya se maneja en el store
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-fondo-principal)' }}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'var(--color-primary-700)' }}
        />
      </div>

      {/* Card de login */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl border animate-fade-in"
        style={{
          backgroundColor: 'var(--color-fondo-card)',
          borderColor: 'var(--color-borde)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            }}
          >
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Sistema HSE</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            Gestión de Seguridad Laboral
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 p-3 rounded-lg text-sm border animate-fade-in"
            style={{
              backgroundColor: 'var(--color-peligro-50)',
              borderColor: 'var(--color-peligro-500)',
              color: 'var(--color-peligro-700)',
            }}
          >
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={manejarSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-texto-secundario)' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => { setCorreo(e.target.value); limpiarError(); }}
              placeholder="coordinador@hse.com"
              required
              className="w-full px-4 py-3 rounded-lg text-sm border outline-none transition-all duration-200 focus:ring-2"
              style={{
                backgroundColor: 'var(--color-fondo-input)',
                borderColor: 'var(--color-borde)',
                color: 'var(--color-texto-principal)',
                '--tw-ring-color': 'var(--color-primary-500)',
              } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-texto-secundario)' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarContrasena ? 'text' : 'password'}
                value={contrasena}
                onChange={(e) => { setContrasena(e.target.value); limpiarError(); }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm border outline-none transition-all duration-200 focus:ring-2"
                style={{
                  backgroundColor: 'var(--color-fondo-input)',
                  borderColor: 'var(--color-borde)',
                  color: 'var(--color-texto-principal)',
                  '--tw-ring-color': 'var(--color-primary-500)',
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--color-texto-tenue)' }}
              >
                {mostrarContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            }}
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div
          className="mt-6 p-3 rounded-lg text-xs space-y-1"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--color-texto-secundario)',
          }}
        >
          <p className="font-medium" style={{ color: 'var(--color-primary-400)' }}>
            Credenciales de prueba:
          </p>
          <p>Correo: coordinador@hse.com</p>
          <p>Clave: AdminHSE2026!</p>
        </div>
      </div>
    </div>
  );
}
