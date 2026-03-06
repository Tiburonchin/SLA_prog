import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, ClipboardCheck, AlertTriangle, Wrench } from 'lucide-react';
import { trabajadoresService } from '../../services/trabajadores.service';
import { inspeccionesService } from '../../services/inspecciones.service';
import { amonestacionesService } from '../../services/amonestaciones.service';
import api from '../../services/api';
import AlertaClimatica from '../../components/weather/AlertaClimatica';

interface TarjetaData {
  titulo: string;
  valor: string;
  icono: any;
  color: string;
  fondo: string;
  link?: string;
}

export default function PaginaDashboard() {
  const navigate = useNavigate();
  const [tarjetas, setTarjetas] = useState<TarjetaData[]>([
    { titulo: 'Trabajadores Activos', valor: '—', icono: Users, color: 'var(--color-primary-500)', fondo: 'rgba(59, 130, 246, 0.1)', link: '/trabajadores' },
    { titulo: 'Inspecciones del Mes', valor: '—', icono: ClipboardCheck, color: 'var(--color-exito-500)', fondo: 'rgba(34, 197, 94, 0.1)', link: '/inspecciones' },
    { titulo: 'Amonestaciones', valor: '—', icono: AlertTriangle, color: 'var(--color-advertencia-500)', fondo: 'rgba(245, 158, 11, 0.1)', link: '/trabajadores' },
    { titulo: 'Inspecciones Pendientes', valor: '—', icono: Wrench, color: 'var(--color-peligro-500)', fondo: 'rgba(239, 68, 68, 0.1)', link: '/inspecciones' },
  ]);
  const [actividadReciente, setActividadReciente] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [trabajadores, inspEstats, amonEstats] = await Promise.all([
          trabajadoresService.obtenerTodos(),
          inspeccionesService.estadisticas(),
          amonestacionesService.estadisticas(),
        ]);

        setTarjetas([
          { titulo: 'Trabajadores Activos', valor: String(trabajadores.total), icono: Users, color: 'var(--color-primary-500)', fondo: 'rgba(59, 130, 246, 0.1)', link: '/trabajadores' },
          { titulo: 'Inspecciones del Mes', valor: String(inspEstats.completadas), icono: ClipboardCheck, color: 'var(--color-exito-500)', fondo: 'rgba(34, 197, 94, 0.1)', link: '/inspecciones' },
          { titulo: 'Amonestaciones', valor: String(amonEstats.total), icono: AlertTriangle, color: 'var(--color-advertencia-500)', fondo: 'rgba(245, 158, 11, 0.1)', link: '/trabajadores' },
          { titulo: 'Insp. En Progreso', valor: String(inspEstats.enProgreso), icono: Wrench, color: 'var(--color-peligro-500)', fondo: 'rgba(239, 68, 68, 0.1)', link: '/inspecciones' },
        ]);

        // Cargar inspecciones recientes
        const { data: inspRecientes } = await api.get('/inspecciones/recientes');
        setActividadReciente(inspRecientes);
      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-7 h-7" style={{ color: 'var(--color-primary-400)' }} />
          Dashboard HSE
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
          Resumen general del sistema de seguridad laboral
        </p>
      </div>

      <AlertaClimatica />

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
        {tarjetas.map((tarjeta, i) => (
          <div
            key={tarjeta.titulo}
            onClick={() => tarjeta.link && navigate(tarjeta.link)}
            className={`transition-all duration-200 animate-fade-in flex flex-col justify-center rounded-xl p-4 bg-white/5 border border-transparent ${tarjeta.link ? 'cursor-pointer hover:scale-[1.02] hover:bg-white/10 hover:border-white/10' : ''}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-3 mb-2 text-sm font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tarjeta.fondo }}>
                <tarjeta.icono className="w-4 h-4" style={{ color: tarjeta.color }} />
              </div>
              {tarjeta.titulo}
            </div>
            <p className="text-4xl font-bold">
              {cargando ? <span className="inline-block w-16 h-10 rounded-lg skeleton-loader" /> : tarjeta.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="pt-2">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        {cargando ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map(i => (
               <div key={i} className="skeleton-loader h-[72px] rounded-lg w-full" />
            ))}
          </div>
        ) : actividadReciente.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-lg"
            style={{ backgroundColor: 'var(--color-fondo-principal)' }}
          >
            <ClipboardCheck className="w-12 h-12 mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
            <p style={{ color: 'var(--color-texto-secundario)' }}>No hay actividad reciente</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-texto-tenue)' }}>
              Las inspecciones y amonestaciones aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actividadReciente.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition" style={{ borderBottom: '1px solid var(--color-borde)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                    backgroundColor: item.estado === 'COMPLETADA' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  }}>
                    <ClipboardCheck className="w-4 h-4" style={{
                      color: item.estado === 'COMPLETADA' ? 'var(--color-exito-500)' : 'var(--color-primary-500)',
                    }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.tipoTrabajo}</p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                      {item.sucursal?.nombre} · {item.supervisor?.usuario?.nombreCompleto}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    backgroundColor: item.estado === 'COMPLETADA' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                    color: item.estado === 'COMPLETADA' ? 'var(--color-exito-500)' : 'var(--color-primary-500)',
                  }}>
                    {item.estado === 'COMPLETADA' ? 'Completada' : 'En Progreso'}
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-texto-tenue)' }}>
                    {new Date(item.creadoEn).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
