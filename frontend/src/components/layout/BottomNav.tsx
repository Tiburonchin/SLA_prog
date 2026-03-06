import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { LayoutDashboard, ScanLine, ClipboardCheck, AlertTriangle } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const { usuario } = useAuthStore();

  if (!usuario) return null;

  // Botones de Bottom Navigation, diseñados para la "Thumb Zone" (mínimo 48px tap target)
  const navItems = [
    { nombre: 'Inicio', ruta: '/', icono: LayoutDashboard },
    { nombre: 'Escanear', ruta: '/escaner', icono: ScanLine, roles: ['COORDINADOR', 'SUPERVISOR'] },
    { nombre: 'Inspec.', ruta: '/inspecciones', icono: ClipboardCheck, roles: ['COORDINADOR', 'SUPERVISOR'] },
    { nombre: 'Alertas', ruta: '/amonestaciones', icono: AlertTriangle, roles: ['COORDINADOR', 'SUPERVISOR'] },
  ];

  const filteredItems = navItems.filter(
    item => !item.roles || item.roles.includes(usuario.rol)
  );

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 w-full bg-[#0f172a] border-t backdrop-blur-md flex items-center justify-around z-50 animate-slide-in safe-area-pb"
      style={{ 
        borderColor: 'var(--color-borde)', 
        backgroundColor: 'rgba(15, 23, 42, 0.95)'
      }}
      aria-label="Navegación principal móvil"
    >
      {filteredItems.map((item) => {
        const activo = item.ruta === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.ruta);

        return (
          <Link
            key={item.ruta}
            to={item.ruta}
            className={`
              flex flex-col items-center justify-center min-h-[64px] min-w-[64px] flex-1 py-2 px-1 transition-colors
              ${activo ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}
            `}
            style={{ color: activo ? 'var(--color-primary-500)' : 'var(--color-texto-secundario)' }}
            aria-current={activo ? 'page' : undefined}
          >
            <item.icono className={`w-6 h-6 mb-1 ${activo ? 'scale-110 transition-transform' : ''}`} />
            <span className="text-[10px] font-medium tracking-wide">
              {item.nombre}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
