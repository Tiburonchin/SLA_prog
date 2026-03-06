import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard,
  Users,
  HardHat,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  Building2,
  ScanLine,
} from 'lucide-react';
import { useState } from 'react';

type RolPermitido = 'COORDINADOR' | 'SUPERVISOR' | 'JEFATURA';

const navegacion: Array<{ nombre: string; ruta: string; icono: any; roles?: RolPermitido[] }> = [
  { nombre: 'Dashboard', ruta: '/', icono: LayoutDashboard },
  { nombre: 'Sucursales', ruta: '/sucursales', icono: Building2, roles: ['COORDINADOR', 'SUPERVISOR'] },
  { nombre: 'Trabajadores', ruta: '/trabajadores', icono: Users, roles: ['COORDINADOR', 'SUPERVISOR'] },
  { nombre: 'Supervisores', ruta: '/supervisores', icono: HardHat, roles: ['COORDINADOR'] },
  { nombre: 'Equipos', ruta: '/equipos', icono: Wrench, roles: ['COORDINADOR', 'SUPERVISOR'] },
  { nombre: 'Matriz IPC', ruta: '/matriz-ipc', icono: Shield, roles: ['COORDINADOR'] },
  { nombre: 'Escáner QR', ruta: '/escaner', icono: ScanLine, roles: ['COORDINADOR', 'SUPERVISOR'] },
  { nombre: 'Inspecciones', ruta: '/inspecciones', icono: ClipboardCheck, roles: ['COORDINADOR', 'SUPERVISOR'] },
  { nombre: 'Amonestaciones', ruta: '/amonestaciones', icono: AlertTriangle, roles: ['COORDINADOR', 'SUPERVISOR'] },
  { nombre: 'Reportes', ruta: '/reportes', icono: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();
  const { usuario, logout } = useAuthStore();
  const [colapsado, setColapsado] = useState(false);

  return (
    <aside
      className={`
        hidden md:flex flex-col h-full transition-all duration-300 ease-in-out
        ${colapsado ? 'w-[72px]' : 'w-64'}
      `}
      style={{ backgroundColor: 'var(--color-fondo-sidebar)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b"
        style={{ borderColor: 'var(--color-borde)' }}>
        {!colapsado && (
          <div className="flex items-center gap-2 animate-fade-in">
            <Shield className="w-7 h-7" style={{ color: 'var(--color-primary-400)' }} />
            <span className="font-bold text-lg tracking-tight">HSE</span>
          </div>
        )}
        <button
          onClick={() => setColapsado(!colapsado)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-texto-secundario)' }}
        >
          {colapsado ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navegacion
          .filter(item => !item.roles || (usuario?.rol && item.roles.includes(usuario.rol as RolPermitido)))
          .map((item) => {
          const activo = item.ruta === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.ruta);
          return (
            <Link
              key={item.ruta}
              to={item.ruta}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${activo
                  ? 'text-white font-medium'
                  : 'hover:bg-white/5'
                }
              `}
              style={{
                backgroundColor: activo ? 'var(--color-primary-600)' : undefined,
                color: activo ? 'white' : 'var(--color-texto-secundario)',
              }}
              title={colapsado ? item.nombre : undefined}
            >
              <item.icono className="w-5 h-5 shrink-0" />
              {!colapsado && (
                <span className="text-sm animate-fade-in">{item.nombre}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pie: usuario y logout */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--color-borde)' }}>
        {!colapsado && usuario && (
          <div className="mb-3 px-2 animate-fade-in">
            <p className="text-sm font-medium truncate">{usuario.nombreCompleto}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-texto-tenue)' }}>
              {usuario.rol}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors hover:bg-red-500/10"
          style={{ color: 'var(--color-peligro-500)' }}
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!colapsado && <span className="text-sm">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
