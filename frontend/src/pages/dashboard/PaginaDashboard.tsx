import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ClipboardCheck, AlertTriangle, Wrench,
  CheckCircle2, ChevronRight, RefreshCw, Flame,
  HardHat, FileWarning, Clock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../services/api';
import AlertaClimatica from '../../components/weather/AlertaClimatica';

/* ─── Tipos del endpoint GET /dashboard/riesgos-activos ─── */
interface DashboardRiesgos {
  generadoEn: string;
  sucursalId: string;
  kpis: {
    equiposConMantenimientoVencido: { total: number; alcance: string; detalle: any[] };
    trabajadoresSinEmoVigente:       { total: number; alcance: string; detalle: any[] };
    inspeccionesAbiertasHoy:         { total: number; alcance: string; nota: string; detalle: any[] };
  };
}

/* Tarjeta semáforo normalizada para el render */
interface AlertaTurno {
  id: string;
  nivel: 'ROJO' | 'AMARILLO';
  icono: React.ReactNode;
  mensaje: string;
  subtexto?: string;
  count: number;
  link: string;
}

/** Convierte la respuesta del backend en alertas semáforas ordenadas por severidad */
function transformarRiesgos(data: DashboardRiesgos): AlertaTurno[] {
  const alertas: AlertaTurno[] = [];
  const { kpis } = data;

  if (kpis.equiposConMantenimientoVencido.total > 0) {
    alertas.push({
      id: 'equipos',
      nivel: 'ROJO',
      icono: <Wrench className="w-5 h-5" />,
      mensaje: `${kpis.equiposConMantenimientoVencido.total} equipo${kpis.equiposConMantenimientoVencido.total !== 1 ? 's' : ''} con calibración/mantenimiento vencido`,
      subtexto: 'Alcance global · Requiere acción inmediata',
      count: kpis.equiposConMantenimientoVencido.total,
      link: '/equipos',
    });
  }

  if (kpis.trabajadoresSinEmoVigente.total > 0) {
    // Si alguno tiene estadoEMO NO_APTO o sin registro → ROJO; solo próximos → AMARILLO
    const tieneNoApto = kpis.trabajadoresSinEmoVigente.detalle.some(
      (t: any) => t.motivo === 'ESTADO_NO_APTO' || t.motivo === 'SIN_REGISTRO_EMO',
    );
    alertas.push({
      id: 'emo',
      nivel: tieneNoApto ? 'ROJO' : 'AMARILLO',
      icono: <FileWarning className="w-5 h-5" />,
      mensaje: `${kpis.trabajadoresSinEmoVigente.total} trabajador${kpis.trabajadoresSinEmoVigente.total !== 1 ? 'es' : ''} sin EMO vigente`,
      subtexto: tieneNoApto ? 'Incluye trabajadores NO APTOS o sin registro' : 'EMO próximo a vencer (≤30 días)',
      count: kpis.trabajadoresSinEmoVigente.total,
      link: '/trabajadores',
    });
  }

  if (kpis.inspeccionesAbiertasHoy.total > 0) {
    alertas.push({
      id: 'inspecciones',
      nivel: 'AMARILLO',
      icono: <ClipboardCheck className="w-5 h-5" />,
      mensaje: `${kpis.inspeccionesAbiertasHoy.total} inspección${kpis.inspeccionesAbiertasHoy.total !== 1 ? 'es' : ''} en campo sin cerrar hoy`,
      subtexto: kpis.inspeccionesAbiertasHoy.nota,
      count: kpis.inspeccionesAbiertasHoy.total,
      link: '/inspecciones',
    });
  }

  // Primero ROJO, luego AMARILLO
  return alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'ROJO' ? -1 : 1));
}

/* ─── Tarjeta de alerta semafórica ─── */
function TarjetaRiesgo({ alerta, onClick }: { alerta: AlertaTurno; onClick?: () => void }) {
  const esRojo = alerta.nivel === 'ROJO';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl border transition-all active:scale-[0.98] hover:brightness-105 ${
        esRojo
          ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
          : 'bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30'
      }`}
      style={{ minHeight: '64px' }}
    >
      {/* Indicador lateral */}
      <div className={`w-1 self-stretch rounded-full shrink-0 ${esRojo ? 'bg-red-500' : 'bg-amber-500'} ${esRojo ? 'animate-pulse' : ''}`} />

      {/* Ícono */}
      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${esRojo ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
        {alerta.icono}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${esRojo ? 'text-red-100' : 'text-amber-100'}`}>
          {esRojo ? '🔴' : '🟡'} {alerta.mensaje}
        </p>
        {alerta.subtexto && (
          <p className="text-xs mt-0.5 opacity-90" style={{ color: 'var(--color-texto-secundario)' }}>
            {alerta.subtexto}
          </p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 shrink-0 opacity-40" />
    </button>
  );
}

/* ─── Tarjeta de esqueleto ─── */
function SkeletonRiesgo() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 rounded-xl border border-white/5 bg-white/[0.03]" style={{ minHeight: '64px' }}>
      <div className="w-1 h-12 rounded-full skeleton-loader" />
      <div className="w-10 h-10 rounded-xl skeleton-loader shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-loader h-4 rounded w-4/5" />
        <div className="skeleton-loader h-3 rounded w-2/5" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════════════════════ */

export default function PaginaDashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();

  const [alertas, setAlertas] = useState<AlertaTurno[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
  const [cargandoRiesgos, setCargandoRiesgos] = useState(true);
  const [errorRiesgos, setErrorRiesgos] = useState(false);

  const [actividadReciente, setActividadReciente] = useState<any[]>([]);
  const [cargandoActividad, setCargandoActividad] = useState(true);

  const cargarRiesgos = async () => {
    setCargandoRiesgos(true);
    setErrorRiesgos(false);
    try {
      const { data } = await api.get<DashboardRiesgos>('/dashboard/riesgos-activos');
      setAlertas(transformarRiesgos(data));
      setUltimaActualizacion(data.generadoEn);
    } catch {
      setErrorRiesgos(true);
      setAlertas([]);
    } finally {
      setCargandoRiesgos(false);
    }
  };

  const cargarActividad = async () => {
    setCargandoActividad(true);
    try {
      const { data } = await api.get('/inspecciones/recientes');
      setActividadReciente(data);
    } catch {
      setActividadReciente([]);
    } finally {
      setCargandoActividad(false);
    }
  };

  useEffect(() => {
    cargarRiesgos();
    cargarActividad();
  }, []);

  const riesgoRojo    = alertas.filter(r => r.nivel === 'ROJO');
  const riesgoAmarillo = alertas.filter(r => r.nivel === 'AMARILLO');
  const turnoLimpio   = !cargandoRiesgos && !errorRiesgos && alertas.length === 0;

  return (
    <div className="space-y-7">

      {/* ── HEADER DE TURNO ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 shrink-0" style={{ color: 'var(--color-primary-400)' }} />
            Turno Activo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {usuario?.nombreCompleto && <span className="font-medium">{usuario.nombreCompleto} · </span>}
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => { cargarRiesgos(); cargarActividad(); }}
          className="p-2.5 rounded-xl border transition-colors hover:bg-white/5 shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px]"
          style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}
          title="Refrescar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* ── ALERTA CLIMÁTICA ── */}
      <AlertaClimatica />

      {/* ══════════════════════════════════════════════════════
          TABLERO DE TAREAS DE TURNO
          ══════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Alertas del Turno
          </h2>
          {!cargandoRiesgos && alertas.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">
              {alertas.length} activa{alertas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Esqueletos */}
        {cargandoRiesgos && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonRiesgo key={i} />)}
          </div>
        )}

        {/* Error de conexión al endpoint (endpoint puede no existir aún) */}
        {!cargandoRiesgos && errorRiesgos && (
          <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--color-borde)' }}>
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium opacity-50">Endpoint de riesgos no disponible</p>
            <p className="text-xs mt-1 opacity-30">Estará disponible cuando el backend esté desplegado</p>
            <button
              onClick={cargarRiesgos}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* Turno sin alertas */}
        {turnoLimpio && (
          <div className="rounded-xl border p-6 text-center bg-emerald-500/5" style={{ borderColor: 'rgba(52,211,153,0.25)' }}>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold text-emerald-300">Sin alertas activas</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-texto-tenue)' }}>Todo el sistema opera dentro de los parámetros normales</p>
          </div>
        )}

        {/* Riesgos ROJO */}
        {riesgoRojo.length > 0 && (
          <div className="space-y-2.5 mb-3">
            {!cargandoRiesgos && (
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-texto-tenue)' }}>
                Acción inmediata
              </p>
            )}
            {riesgoRojo.map(a => (
              <TarjetaRiesgo
                key={a.id}
                alerta={a}
                onClick={() => navigate(a.link)}
              />
            ))}
          </div>
        )}

        {/* Riesgos AMARILLO */}
        {riesgoAmarillo.length > 0 && (
          <div className="space-y-2.5">
            {!cargandoRiesgos && (
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-texto-tenue)' }}>
                Seguimiento
              </p>
            )}
            {riesgoAmarillo.map(a => (
              <TarjetaRiesgo
                key={a.id}
                alerta={a}
                onClick={() => navigate(a.link)}
              />
            ))}
          </div>
        )}
        {ultimaActualizacion && !cargandoRiesgos && (
          <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-texto-tenue)' }}>
            Actualizado: {new Date(ultimaActualizacion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </section>
      {usuario?.rol === 'SUPERVISOR' && (
        <section>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-blue-400" />
            Acciones de Turno
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nueva inspección', icono: ClipboardCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', link: '/inspecciones' },
              { label: 'Escanear trabajador', icono: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', link: '/escaner' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.link)}
                className="flex items-center gap-3 px-4 py-4 rounded-xl border transition-all active:scale-[0.97] hover:bg-white/5"
                style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)', minHeight: '64px' }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg} ${a.color} shrink-0`}>
                  <a.icono className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-left leading-snug">{a.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── ACTIVIDAD RECIENTE ── */}
      <section>
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
          Actividad Reciente
        </h2>

        {cargandoActividad ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-loader h-[68px] rounded-xl w-full" />
            ))}
          </div>
        ) : actividadReciente.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-xl" style={{ backgroundColor: 'rgba(30,41,59,0.4)' }}>
            <ClipboardCheck className="w-10 h-10 mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
            <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Sin actividad reciente</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-texto-tenue)' }}>Las inspecciones aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actividadReciente.map((item: any) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 rounded-xl border transition hover:bg-white/[0.03] gap-3 sm:gap-0"
                style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{
                    backgroundColor: item.estado === 'COMPLETADA' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  }}>
                    <ClipboardCheck className="w-4 h-4" style={{
                      color: item.estado === 'COMPLETADA' ? 'var(--color-exito-500)' : 'var(--color-primary-500)',
                    }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{item.tipoTrabajo}</p>
                    <p className="text-xs mt-0.5 opacity-80" style={{ color: 'var(--color-texto-secundario)' }}>
                      {item.sucursal?.nombre} · {item.supervisor?.usuario?.nombreCompleto}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                    backgroundColor: item.estado === 'COMPLETADA' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                    color: item.estado === 'COMPLETADA' ? 'var(--color-exito-500)' : 'var(--color-primary-400)',
                  }}>
                    {item.estado === 'COMPLETADA' ? 'Completada' : 'En Progreso'}
                  </span>
                  <p className="text-xs mt-0 sm:mt-1 font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
                    {new Date(item.creadoEn).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
