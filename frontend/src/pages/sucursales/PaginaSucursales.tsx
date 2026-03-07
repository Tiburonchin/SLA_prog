import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Search, Plus, Edit2, Trash2, MapPin,
  MoreVertical, X, Check,
  Users, ClipboardCheck, AlertTriangle, Shield, ShieldCheck, ShieldAlert,
  ExternalLink, Download, ArrowRight, ChevronRight,
} from 'lucide-react';
import { sucursalesService } from '../../services/trabajadores.service';
import type { Sucursal, CrearSucursalData, NivelRiesgo } from '../../services/trabajadores.service';

/* ─── Semáforo de riesgo compacto (para tabla) ─── */
const RIESGO_CFG: Record<NivelRiesgo, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  BAJO:    { label: 'Bajo',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  MEDIO:   { label: 'Medio',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: <Shield className="w-3.5 h-3.5" />      },
  ALTO:    { label: 'Alto',    color: 'text-orange-400',  bg: 'bg-orange-500/10',  icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  CRITICO: { label: 'Crítico', color: 'text-red-400',     bg: 'bg-red-500/10',     icon: <ShieldAlert className="w-3.5 h-3.5" /> },
};

function BadgeRiesgo({ nivel }: { nivel?: NivelRiesgo | null }) {
  if (!nivel) return <span className="text-xs opacity-30">—</span>;
  const cfg = RIESGO_CFG[nivel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

/* ─── Indicador de alerta DC ─── */
function AlertaDC({ fecha }: { fecha?: string | null }) {
  if (!fecha) return null;
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 animate-pulse" title="Certificado DC VENCIDO">
      <AlertTriangle className="w-3 h-3" /> DC Vencido
    </span>
  );
  if (dias <= 30) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400" title={`Certif. DC vence en ${dias} días`}>
      <AlertTriangle className="w-3 h-3" /> {dias}d
    </span>
  );
  return null;
}

/* ─── Helper: abrir Google Maps ─── */
function abrirMapa(lat?: number, lon?: number) {
  if (lat != null && lon != null) {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  }
}

/* ─── Helper: exportar CSV ─── */
function exportarCSV(sucursales: Sucursal[]) {
  const cabeceras = 'Nombre,Dirección,Trabajadores,Inspecciones,Amonestaciones,Supervisores,Latitud,Longitud';
  const filas = sucursales.map(s =>
    `"${s.nombre}","${s.direccion || ''}",${s._count?.trabajadores || 0},${s._count?.inspecciones || 0},${s._count?.amonestaciones || 0},${s._count?.supervisores || 0},${s.latitud || ''},${s.longitud || ''}`
  );
  const csv = [cabeceras, ...filas].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sucursales_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Badge con color ─── */
function Badge({ valor, color = 'blue' }: { valor: number; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-xs font-bold ${colors[color] || colors.blue}`}>
      {valor}
    </span>
  );
}

/* ─── Menú contextual de acciones ─── */
function MenuAcciones({
  sucursal,
  onEditar,
  onEliminar,
}: {
  sucursal: Sucursal;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function cerrar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    if (abierto) document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        style={{ color: 'var(--color-texto-secundario)' }}
        aria-label="Acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {abierto && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-2xl z-50 py-1 animate-fade-in"
          style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
        >
          {sucursal.latitud != null && sucursal.longitud != null && (
            <button
              onClick={() => { abrirMapa(sucursal.latitud, sucursal.longitud); setAbierto(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
              style={{ color: 'var(--color-texto-principal)' }}
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              Ver en Mapa
            </button>
          )}
          <button
            onClick={() => { onEditar(); setAbierto(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
            style={{ color: 'var(--color-texto-principal)' }}
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
            Editar
          </button>
          <button
            onClick={() => { onEliminar(); setAbierto(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-red-500/10 transition-colors text-left text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Fila expandible de detalle ─── */
function FilaDetalle({ sucursal }: { sucursal: Sucursal }) {
  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className="animate-expand border-t" style={{ borderColor: 'var(--color-borde)' }}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bloque: Info General */}
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.5)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-texto-tenue)' }}>
                Información General
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-texto-secundario)' }}>Dirección</span>
                  <span className="font-medium text-right max-w-[60%]">{sucursal.direccion || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-texto-secundario)' }}>Coordenadas</span>
                  <span className="font-medium">
                    {sucursal.latitud != null ? `${sucursal.latitud?.toFixed(4)}, ${sucursal.longitud?.toFixed(4)}` : '—'}
                  </span>
                </div>
                {sucursal.latitud != null && (
                  <button
                    onClick={() => abrirMapa(sucursal.latitud, sucursal.longitud)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition hover:bg-emerald-500/20 text-emerald-400 border"
                    style={{ borderColor: 'rgba(52,211,153,0.3)' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir en Google Maps
                  </button>
                )}
              </div>
            </div>

            {/* Bloque: Estadísticas rápidas */}
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.5)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-texto-tenue)' }}>
                Estadísticas
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                    <Users className="w-4 h-4 text-blue-400" />
                    Trabajadores
                  </div>
                  <Badge valor={sucursal._count?.trabajadores || 0} color="blue" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                    <Shield className="w-4 h-4 text-purple-400" />
                    Supervisores
                  </div>
                  <Badge valor={sucursal._count?.supervisores || 0} color="purple" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    Inspecciones
                  </div>
                  <Badge valor={sucursal._count?.inspecciones || 0} color="green" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Amonestaciones
                  </div>
                  <Badge
                    valor={sucursal._count?.amonestaciones || 0}
                    color={(sucursal._count?.amonestaciones || 0) > 0 ? 'red' : 'green'}
                  />
                </div>
              </div>
            </div>

            {/* Bloque: Acciones rápidas */}
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.5)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-texto-tenue)' }}>
                Acciones Rápidas
              </h4>
              <div className="space-y-2">
                <a
                  href={`/trabajadores?sucursalId=${sucursal.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/5 border"
                  style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Ver Trabajadores
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
                </a>
                <a
                  href={`/inspecciones?sucursalId=${sucursal.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/5 border"
                  style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                >
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    Ver Inspecciones
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
                </a>
                <a
                  href={`/amonestaciones?sucursalId=${sucursal.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/5 border"
                  style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Ver Amonestaciones
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─── Drawer lateral para crear/editar ─── */
function DrawerSucursal({
  abierto,
  editandoId,
  formData,
  setFormData,
  guardando,
  error,
  onCerrar,
  onSubmit,
}: {
  abierto: boolean;
  editandoId: string | null;
  formData: CrearSucursalData;
  setFormData: (d: CrearSucursalData) => void;
  guardando: boolean;
  error: string;
  onCerrar: () => void;
  onSubmit: () => void;
}) {
  /* Portal to document.body to escape Layout's CSS transform stacking context */
  return createPortal(
    <div
      className="fixed inset-0 z-[70] pointer-events-none"
      style={{ visibility: abierto ? 'visible' : 'hidden' }}
    >
      {/* Overlay — full opaque dark to avoid bleed-through */}
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-auto"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          opacity: abierto ? 1 : 0,
        }}
        onClick={!guardando ? onCerrar : undefined}
      />

      {/* Panel lateral — CSS transition, NO keyframe animation */}
      <div
        className="absolute top-0 right-0 h-full w-full max-w-lg flex flex-col shadow-2xl pointer-events-auto"
        style={{
          backgroundColor: 'var(--color-fondo-principal)',
          borderLeft: '1px solid var(--color-borde)',
          transform: abierto ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="font-bold text-lg">{editandoId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
          </div>
          <button
            onClick={onCerrar}
            disabled={guardando}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>
              {error}
            </div>
          )}

          {/* Sección: Identificación */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-texto-tenue)' }}>
              Identificación
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ borderColor: 'var(--color-borde)' }}
                  placeholder="Ej. Planta Monterrey"
                  autoFocus={abierto}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  Dirección
                </label>
                <textarea
                  value={formData.direccion || ''}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-3 min-h-[80px] rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  style={{ borderColor: 'var(--color-borde)' }}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </div>

          {/* Sección: Geolocalización */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-texto-tenue)' }}>
              Geolocalización
            </h3>
            <button
              type="button"
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setFormData({
                        ...formData,
                        latitud: pos.coords.latitude,
                        longitud: pos.coords.longitude,
                      });
                    },
                    () => alert('No se pudo obtener la ubicación.'),
                  );
                } else {
                  alert('Geolocalización no soportada en este navegador.');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition hover:bg-blue-500/10 text-blue-400 mb-4"
              style={{ borderColor: 'rgba(59,130,246,0.3)' }}
            >
              <MapPin className="w-5 h-5" />
              Usar mi ubicación actual
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitud ?? ''}
                  onChange={e => setFormData({ ...formData, latitud: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  style={{ borderColor: 'var(--color-borde)' }}
                  placeholder="25.6866"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitud ?? ''}
                  onChange={e => setFormData({ ...formData, longitud: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  style={{ borderColor: 'var(--color-borde)' }}
                  placeholder="-100.316"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm border transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={guardando || !formData.nombre.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
          >
            <Check className="w-4 h-4" />
            {guardando ? 'Procesando...' : (editandoId ? 'Guardar Cambios' : 'Crear Sucursal')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL DE SUCURSALES
   ══════════════════════════════════════════════════════════════ */

export default function PaginaSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Drawer
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CrearSucursalData>({ nombre: '', direccion: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const cargarSucursales = async () => {
    setCargando(true);
    try {
      const data = await sucursalesService.obtenerTodas();
      setSucursales(data);
    } catch (err) {
      console.error('Error al cargar sucursales:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const sucursalesFiltradas = sucursales.filter(s =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.direccion && s.direccion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalTrabajadores = sucursales.reduce((a, s) => a + (s._count?.trabajadores || 0), 0);
  const totalInspecciones = sucursales.reduce((a, s) => a + (s._count?.inspecciones || 0), 0);
  const totalAmonestaciones = sucursales.reduce((a, s) => a + (s._count?.amonestaciones || 0), 0);

  const abrirCrear = () => {
    setEditandoId(null);
    setFormData({ nombre: '', direccion: '' });
    setError('');
    setDrawerAbierto(true);
  };

  const abrirEditar = (sucursal: Sucursal) => {
    setEditandoId(sucursal.id);
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      latitud: sucursal.latitud,
      longitud: sucursal.longitud,
    });
    setError('');
    setDrawerAbierto(true);
  };

  const manejarSubmit = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      if (editandoId) {
        await sucursalesService.actualizar(editandoId, formData);
      } else {
        await sucursalesService.crear(formData);
      }
      setDrawerAbierto(false);
      cargarSucursales();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la sucursal');
    } finally {
      setGuardando(false);
    }
  };

  const manejarDesactivar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar la sucursal "${nombre}"?`)) return;
    try {
      await sucursalesService.desactivar(id);
      cargarSucursales();
    } catch (err) {
      console.error('Error al desactivar:', err);
      alert('No se pudo desactivar la sucursal');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Sucursales</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400">
              {sucursales.length} activas
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
            Gestiona las sedes, ubicaciones, supervisores asignados y métricas de seguridad por sucursal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportarCSV(sucursalesFiltradas)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border transition-colors hover:bg-white/5"
            style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}
            title="Exportar CSV"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all active:scale-[0.98] shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
          >
            <Plus className="w-5 h-5" />
            Nueva Sucursal
          </button>
        </div>
      </div>

      {/* ── RESUMEN RÁPIDO (KPI Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sucursales', value: sucursales.length, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Trabajadores', value: totalTrabajadores, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Inspecciones', value: totalInspecciones, icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Amonestaciones', value: totalAmonestaciones, icon: AlertTriangle, color: totalAmonestaciones > 0 ? 'text-red-400' : 'text-emerald-400', bg: totalAmonestaciones > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="rounded-xl border p-4 flex items-center gap-4"
            style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── BUSCADOR ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
        />
      </div>

      {/* ── TABLA PRINCIPAL ── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}>
        {cargando ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-loader h-14 rounded-lg" />
            ))}
          </div>
        ) : sucursalesFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2">No se encontraron sucursales</h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-texto-secundario)' }}>
              {busqueda ? 'Intenta con otros términos de búsqueda' : 'No hay sucursales registradas en el sistema'}
            </p>
            {!busqueda && (
              <button
                onClick={abrirCrear}
                className="px-5 py-2.5 text-white rounded-lg font-bold text-sm transition-all active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
              >
                Crear primera sucursal
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>
                  <th className="px-5 py-3.5 font-semibold">Sucursal</th>
                  <th className="px-5 py-3.5 font-semibold">Dirección</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Riesgo</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Supervisores</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Trabajadores</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Inspecciones</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sucursalesFiltradas.map((sucursal) => (
                  <tr
                    key={sucursal.id}
                    className="border-b transition-colors cursor-pointer group hover:bg-white/[0.03]"
                    style={{ borderColor: 'var(--color-borde)' }}
                    onClick={() => navigate(`/sucursales/${sucursal.id}`)}
                  >
                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 shrink-0">
                          <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="font-semibold flex items-center gap-2 flex-wrap">
                            {sucursal.nombre}
                            <AlertaDC fecha={sucursal.vencimientoCertificadoDC} />
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Dirección */}
                    <td className="px-5 py-4" style={{ color: 'var(--color-texto-secundario)' }}>
                      {sucursal.direccion ? (
                        <div className="flex items-center gap-1.5 max-w-[240px]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-50" />
                          <span className="truncate">{sucursal.direccion}</span>
                          {sucursal.latitud != null && (
                            <button
                              onClick={(e) => { e.stopPropagation(); abrirMapa(sucursal.latitud, sucursal.longitud); }}
                              className="shrink-0 p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Abrir en Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </td>
                    {/* Riesgo */}
                    <td className="px-5 py-4 text-center">
                      <BadgeRiesgo nivel={sucursal.nivelRiesgo} />
                    </td>
                    {/* Supervisores */}
                    <td className="px-5 py-4 text-center">
                      <Badge valor={sucursal._count?.supervisores || 0} color="purple" />
                    </td>
                    {/* Trabajadores */}
                    <td className="px-5 py-4 text-center">
                      <Badge valor={sucursal._count?.trabajadores || 0} color="blue" />
                    </td>
                    {/* Inspecciones */}
                    <td className="px-5 py-4 text-center">
                      <Badge valor={sucursal._count?.inspecciones || 0} color="green" />
                    </td>
                    {/* Acciones */}
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <MenuAcciones
                          sucursal={sucursal}
                          onEditar={() => abrirEditar(sucursal)}
                          onEliminar={() => manejarDesactivar(sucursal.id, sucursal.nombre)}
                        />
                        <span className="p-1.5 rounded-lg opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--color-texto-secundario)' }}>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DRAWER LATERAL ── */}
      <DrawerSucursal
        abierto={drawerAbierto}
        editandoId={editandoId}
        formData={formData}
        setFormData={setFormData}
        guardando={guardando}
        error={error}
        onCerrar={() => !guardando && setDrawerAbierto(false)}
        onSubmit={manejarSubmit}
      />
    </div>
  );
}
