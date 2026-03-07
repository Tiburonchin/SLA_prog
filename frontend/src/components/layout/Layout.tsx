import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  const { usuario, inicializando } = useAuthStore();
  const location = useLocation();

  const TITULOS: Record<string, string> = {
    '/': 'Turno Activo',
    '/inspecciones': 'Inspecciones',
    '/escaner': 'Escáner QR',
    '/amonestaciones': 'Amonestaciones',
    '/reportes': 'Reportes',
    '/trabajadores': 'Trabajadores',
    '/equipos': 'Equipos',
  };

  // Mientras cargarSesion verifica la sesión guardada, mostrar spinner
  // evita que RutaProtegida redirija a /login antes de tiempo
  if (inicializando) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-fondo-principal)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Cargando sesión…</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
      {/* Skip Navigation Link (WCAG) */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-bold">
        Saltar al contenido principal
      </a>

      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <main id="main-content" role="main" tabIndex={-1} className="flex-1 overflow-y-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 md:px-8 border-b backdrop-blur-md"
          style={{
            borderColor: 'var(--color-borde)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <h2 className="text-lg font-semibold hidden sm:block">Sistema de Gestión HSE</h2>
          <h2 className="text-lg font-semibold sm:hidden">{TITULOS[location.pathname] ?? 'HSE'}</h2>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
            >
              {usuario.nombreCompleto.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenido de cada página */}
        <div className="p-4 md:p-8 pb-20 md:pb-8 flex-1 w-full animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Navegación Móvil */}
      <BottomNav />
    </div>
  );
}
