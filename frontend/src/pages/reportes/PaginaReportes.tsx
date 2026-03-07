import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Wrench, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { amonestacionesService } from '../../services/amonestaciones.service';
import { inspeccionesService } from '../../services/inspecciones.service';
import api from '../../services/api';

const COLORES_SEVERIDAD = ['#f59e0b', '#f97316', '#ef4444'];
const COLORES_ESTADO = ['#3b82f6', '#22c55e', '#ef4444'];

export default function PaginaReportes() {
  const [cargando, setCargando] = useState(true);
  const [amonStats, setAmonStats] = useState<any>(null);
  const [amonPorSucursal, setAmonPorSucursal] = useState<any[]>([]);
  const [inspStats, setInspStats] = useState<any>(null);
  const [calibraciones, setCalibraciones] = useState<any[]>([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [as, aps, is, cal] = await Promise.all([
          amonestacionesService.estadisticas(),
          amonestacionesService.estadisticasPorSucursal(),
          inspeccionesService.estadisticas(),
          api.get('/equipos/calibraciones/por-vencer').then(r => r.data),
        ]);
        setAmonStats(as);
        setAmonPorSucursal(aps);
        setInspStats(is);
        setCalibraciones(cal);
      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  const pieDataSeveridad = amonStats ? [
    { name: 'Leves', value: amonStats.leves },
    { name: 'Graves', value: amonStats.graves },
    { name: 'Críticas', value: amonStats.criticas },
  ] : [];

  const pieDataInsp = inspStats ? [
    { name: 'En Progreso', value: inspStats.enProgreso },
    { name: 'Completadas', value: inspStats.completadas },
    { name: 'Canceladas', value: inspStats.canceladas },
  ] : [];

  const descargarCSV = async (tipo: 'amonestaciones' | 'inspecciones') => {
    try {
      const response = await api.get(`/${tipo}/exportar/csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Error al descargar el CSV:', e); }
  };

  const descargarPDFSemanal = async () => {
    try {
      const response = await api.get('/reportes/pdf/semanal', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Semanal_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error al descargar el PDF:', e);
      alert('Hubo un error al generar el PDF.');
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-7 h-7" style={{ color: 'var(--color-primary-500)' }} />
            Reportes y Analítica
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            Indicadores clave de gestión HSE
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row flex-wrap">
          <button onClick={descargarPDFSemanal}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium rounded-lg text-white transition hover:shadow-lg active:scale-[0.97] w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}>
            <Download className="w-4 h-4" /> Reporte PDF
          </button>
          <button onClick={() => descargarCSV('amonestaciones')}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium rounded-lg border hover:bg-white/5 transition active:scale-[0.97] w-full sm:w-auto"
            style={{ borderColor: 'var(--color-borde)' }}>
            <Download className="w-4 h-4" /> CSV Amonestaciones
          </button>
          <button onClick={() => descargarCSV('inspecciones')}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium rounded-lg border hover:bg-white/5 transition active:scale-[0.97] w-full sm:w-auto"
            style={{ borderColor: 'var(--color-borde)' }}>
            <Download className="w-4 h-4" /> CSV Inspecciones
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { titulo: 'Total Amonestaciones', valor: amonStats?.total || 0, color: 'var(--color-advertencia-500)', icono: AlertTriangle },
          { titulo: 'Inspecciones Completadas', valor: inspStats?.completadas || 0, color: 'var(--color-exito-500)', icono: TrendingUp },
          { titulo: 'Insp. En Progreso', valor: inspStats?.enProgreso || 0, color: 'var(--color-primary-500)', icono: BarChart3 },
          { titulo: 'Calibraciones por Vencer', valor: calibraciones.length, color: 'var(--color-peligro-500)', icono: Wrench },
        ].map((kpi) => (
          <div key={kpi.titulo} className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{kpi.titulo}</span>
              <kpi.icono className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold">{kpi.valor}</p>
          </div>
        ))}
      </div>

      {/* Gráficos principales */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Amonestaciones por sucursal */}
        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <h3 className="font-semibold mb-4">Amonestaciones por Sucursal</h3>
          {amonPorSucursal.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={amonPorSucursal}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sucursal" tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.3)" />
                <YAxis tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.3)" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="leves" name="Leves" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="graves" name="Graves" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="criticas" name="Críticas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-56" style={{ color: 'var(--color-texto-tenue)' }}>
              Sin datos suficientes
            </div>
          )}
        </div>

        {/* Distribución de severidad */}
        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <h3 className="font-semibold mb-4">Distribución por Severidad</h3>
          {amonStats && amonStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieDataSeveridad} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {pieDataSeveridad.map((_, i) => (
                    <Cell key={i} fill={COLORES_SEVERIDAD[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-56" style={{ color: 'var(--color-texto-tenue)' }}>
              Sin amonestaciones registradas
            </div>
          )}
        </div>
      </div>

      {/* Inspecciones pie + Alertas de calibración */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Estado de inspecciones */}
        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <h3 className="font-semibold mb-4">Estado de Inspecciones</h3>
          {inspStats && inspStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieDataInsp} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {pieDataInsp.map((_, i) => (
                    <Cell key={i} fill={COLORES_ESTADO[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-56" style={{ color: 'var(--color-texto-tenue)' }}>
              Sin inspecciones registradas
            </div>
          )}
        </div>

        {/* Alertas de calibración */}
        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4" style={{ color: 'var(--color-peligro-500)' }} />
            Calibraciones Próximas a Vencer
          </h3>
          {calibraciones.length === 0 ? (
            <div className="flex items-center justify-center h-56" style={{ color: 'var(--color-texto-tenue)' }}>
              No hay calibraciones por vencer en los próximos 30 días
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {calibraciones.map((cal: any) => {
                const diasRestantes = Math.ceil((new Date(cal.proximaCalibracion).getTime() - Date.now()) / 86400000);
                const urgencia = diasRestantes <= 5 ? '#ef4444' : diasRestantes <= 15 ? '#f97316' : '#f59e0b';
                return (
                  <div key={cal.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                    <div>
                      <p className="text-sm font-medium">{cal.equipo?.nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                        {cal.equipo?.marca} · S/N: {cal.equipo?.numeroSerie}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${urgencia}20`, color: urgencia }}>
                        {diasRestantes} días
                      </span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
                        {new Date(cal.proximaCalibracion).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
