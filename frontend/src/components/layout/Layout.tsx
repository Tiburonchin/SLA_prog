import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import Sidebar from './Sidebar';

export default function Layout() {
  const { usuario } = useAuthStore();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-10 h-16 flex items-center justify-between px-8 border-b backdrop-blur-md"
          style={{
            borderColor: 'var(--color-borde)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <h2 className="text-lg font-semibold">Sistema de Gestión HSE</h2>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
            >
              {usuario.nombreCompleto.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenido de cada página */}
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
