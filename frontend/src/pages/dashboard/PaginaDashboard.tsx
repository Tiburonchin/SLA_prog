import { useState, useEffect } from 'react';
import { Shield, Users, ClipboardCheck, AlertTriangle, Wrench } from 'lucide-react';
import { trabajadoresService } from '../../services/trabajadores.service';
import { inspeccionesService } from '../../services/inspecciones.service';
import { amonestacionesService } from '../../services/amonestaciones.service';
import api from '../../services/api';

interface TarjetaData {
  titulo: string;
  valor: string;
  icono: any;
  color: string;
  fondo: string;
}

export default function PaginaDashboard() {
  const [tarjetas, setTarjetas] = useState<TarjetaData[]>([
    { titulo: 'Trabajadores Activos', valor: '—', icono: Users, color: 'var(--color-primary-500)', fondo: 'rgba(59, 130, 246, 0.1)' },
    { titulo: 'Inspecciones del Mes', valor: '—', icono: ClipboardCheck, color: 'var(--color-exito-500)', fondo: 'rgba(34, 197, 94, 0.1)' },
    { titulo: 'Amonestaciones', valor: '—', icono: AlertTriangle, color: 'var(--color-advertencia-500)', fondo: 'rgba(245, 158, 11, 0.1)' },
    { titulo: 'Inspecciones Pendientes', valor: '—', icono: Wrench, color: 'var(--color-peligro-500)', fondo: 'rgba(239, 68, 68, 0.1)' },
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
          { titulo: 'Trabajadores Activos', valor: String(trabajadores.total), icono: Users, color: 'var(--color-primary-500)', fondo: 'rgba(59, 130, 246, 0.1)' },
          { titulo: 'Inspecciones del Mes', valor: String(inspEstats.completadas), icono: ClipboardCheck, color: 'var(--color-exito-500)', fondo: 'rgba(34, 197, 94, 0.1)' },
          { titulo: 'Amonestaciones', valor: String(amonEstats.total), icono: AlertTriangle, color: 'var(--color-advertencia-500)', fondo: 'rgba(245, 158, 11, 0.1)' },
          { titulo: 'Insp. En Progreso', valor: String(inspEstats.enProgreso), icono: Wrench, color: 'var(--color-peligro-500)', fondo: 'rgba(239, 68, 68, 0.1)' },
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

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tarjetas.map((tarjeta, i) => (
          <div
            key={tarjeta.titulo}
            className="rounded-xl p-5 border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] animate-fade-in"
            style={{
              backgroundColor: 'var(--color-fondo-card)',
              borderColor: 'var(--color-borde)',
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
                {tarjeta.titulo}
              </span>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: tarjeta.fondo }}
              >
                <tarjeta.icono className="w-5 h-5" style={{ color: tarjeta.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold">
              {cargando ? (
                <span className="inline-block w-10 h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--color-fondo-principal)' }} />
              ) : tarjeta.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--color-fondo-card)',
          borderColor: 'var(--color-borde)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        {cargando ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
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
