import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { equiposService, type Equipo, type TipoEquipo } from '../../services/equipos.service';
import {
  ShieldAlert, Plus, Search, ChevronRight, AlertTriangle, CheckCircle,
  Wifi, Lock, Clock, Zap, Ban, Building2, ClipboardCheck, Filter,
} from 'lucide-react';
import { useNfcReader } from '../../hooks/useNfcReader';
import AltaEquipoWizard from './components/AltaEquipoWizard';

// ─── Derivación de Estado de Seguridad ────────────────────────────────────────
type EstadoSeguridad = 'OPERATIVO' | 'OBSERVADO' | 'BLOQUEADO_LOTO' | 'INMOVILIZADO';

const SEGURIDAD_BADGE: Record<EstadoSeguridad, { label: string; color: string; bg: string; icono: typeof CheckCircle }> = {
  OPERATIVO:      { label: 'Operativo',      color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  icono: CheckCircle   },
  OBSERVADO:      { label: 'Observado',      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icono: AlertTriangle },
  BLOQUEADO_LOTO: { label: 'Bloqueado/LOTO', color: '#fbbf24', bg: 'rgba(30,30,30,0.9)',    icono: Lock          },
  INMOVILIZADO:   { label: 'Inmovilizado',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  icono: Ban           },
};

const RIESGO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  CRITICO: { label: 'CRÍTICO', color: '#fff',    bg: '#dc2626' },
  ALTO:    { label: 'ALTO',    color: '#fff',    bg: '#ea580c' },
  MEDIO:   { label: 'MEDIO',   color: '#78350f', bg: '#fde68a' },
  BAJO:    { label: 'BAJO',    color: '#065f46', bg: '#a7f3d0' },
};

function diasHasta(fecha?: string): number | null {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

function textoVencimiento(fecha?: string): { dias: number; texto: string; color: string } | null {
  const d = diasHasta(fecha);
  if (d === null) return null;
  if (d < 0)  return { dias: d, texto: `Vencido hace ${Math.abs(d)}d`, color: '#ef4444' };
  if (d <= 7) return { dias: d, texto: `${d}d para vencer`,           color: '#f59e0b' };
  if (d <= 30) return { dias: d, texto: `${d}d restantes`,            color: '#f59e0b' };
  return { dias: d, texto: `${d}d restantes`, color: '#22c55e' };
}

/** Fecha más próxima entre calibración y mantenimiento */
function fechaVencimientoLegal(eq: Equipo): string | undefined {
  const fechas: string[] = [];
  if (eq.proximoMantenimiento) fechas.push(eq.proximoMantenimiento);
  const proxCal = eq.calibraciones?.[0]?.proximaCalibracion;
  if (proxCal) fechas.push(proxCal);
  if (fechas.length === 0) return undefined;
  return fechas.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

/** ¿Tiene un LOTO activo (BLOQUEADO)? */
function tieneLoToActivo(eq: Equipo): boolean {
  return !!eq.ejecucionesLoto?.some(l => l.estadoEjecucion === 'BLOQUEADO');
}

/** ¿Está vencido (calibración/mantenimiento)? */
function estaVencido(eq: Equipo): boolean {
  const d1 = diasHasta(eq.proximoMantenimiento);
  const d2 = diasHasta(eq.calibraciones?.[0]?.proximaCalibracion);
  return (d1 !== null && d1 < 0) || (d2 !== null && d2 < 0);
}

/** Vence en 7 días o menos (sin estar vencido) */
function venceProximamente(eq: Equipo): boolean {
  const fecha = fechaVencimientoLegal(eq);
  const d = diasHasta(fecha);
  return d !== null && d >= 0 && d <= 7;
}

function derivarEstadoSeguridad(eq: Equipo): EstadoSeguridad {
  if (eq.estado === 'BAJA_TECNICA' || estaVencido(eq)) return 'INMOVILIZADO';
  if (tieneLoToActivo(eq)) return 'BLOQUEADO_LOTO';
  if (eq.estado === 'EN_MANTENIMIENTO' || venceProximamente(eq)) return 'OBSERVADO';
  return 'OPERATIVO';
}

function derivarNivelRiesgo(eq: Equipo): keyof typeof RIESGO_BADGE {
  const tipo = eq.tipoEquipo as TipoEquipo | undefined;
  if (tipo === 'EQUIPO_PRESION' || tipo === 'MAQUINARIA_PESADA') return 'CRITICO';
  if (eq.requiereLoto || (eq.energiasPeligrosas && eq.energiasPeligrosas.length > 0)) return 'ALTO';
  if (tipo === 'HERRAMIENTA_PODER' || tipo === 'VEHICULO') return 'MEDIO';
  return 'BAJO';
}

function tieneEnergiaPeligrosa(eq: Equipo): boolean {
  return !!eq.energiasPeligrosas && eq.energiasPeligrosas.length > 0;
}

function ultimoPreUso(eq: Equipo): string | null {
  const insp = eq.inspecciones;
  if (!insp || insp.length === 0) return null;
  const sorted = [...insp].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  return sorted[0].creadoEn;
}

function formatFechaCorta(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFechaHora(iso?: string | null): string {
  if (!iso) return 'Sin registro';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

// ─── Filtros Rápidos ──────────────────────────────────────────────────────────
type FiltroRapido = '' | 'VENCIDOS_OBSERVADOS' | 'LOTO_ACTIVO' | 'SEDE';

// ─── Componente KPI Card ──────────────────────────────────────────────────────
function KpiCard({ titulo, valor, subtitulo, icono: Icono, bgColor, textColor, iconColor, onClick, activo }: {
  titulo: string; valor: number | string; subtitulo?: string;
  icono: typeof AlertTriangle; bgColor: string; textColor: string; iconColor: string;
  onClick?: () => void; activo?: boolean;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`relative flex flex-col gap-1 p-4 rounded-xl border text-left transition-all min-h-[100px] w-full
        ${activo ? 'ring-2 ring-offset-1 scale-[1.02]' : 'hover:scale-[1.01]'}`}
      style={{
        backgroundColor: bgColor, borderColor: activo ? iconColor : 'transparent',
      }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textColor, opacity: 0.8 }}>{titulo}</span>
        <Icono className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <span className="text-3xl font-black leading-none" style={{ color: textColor }}>{valor}</span>
      {subtitulo && <span className="text-xs mt-0.5" style={{ color: textColor, opacity: 0.7 }}>{subtitulo}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PaginaEquipos() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarWizard, setMostrarWizard] = useState(false);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>('');
  const [filtroSede, setFiltroSede] = useState('');

  const { leerNfc, leyendo, soportado, error: nfcError, cancelarLectura } = useNfcReader();
  const [modalNfc, setModalNfc] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await equiposService.obtenerTodos(busqueda || undefined, filtroEstado || undefined);
      setEquipos(data);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, [filtroEstado]);
  useEffect(() => {
    const t = setTimeout(() => cargarDatos(), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // ─── KPIs computados ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    let peligro = 0;
    let loto = 0;
    let vence7d = 0;
    let conPreUsoHoy = 0;
    const hoy = new Date().toDateString();

    for (const eq of equipos) {
      if (eq.estado === 'BAJA_TECNICA' || estaVencido(eq)) peligro++;
      if (tieneLoToActivo(eq)) loto++;
      if (venceProximamente(eq)) vence7d++;
      const pu = ultimoPreUso(eq);
      if (pu && new Date(pu).toDateString() === hoy) conPreUsoHoy++;
    }
    const pctPreUso = equipos.length > 0 ? Math.round((conPreUsoHoy / equipos.length) * 100) : 0;
    return { peligro, loto, vence7d, conPreUsoHoy, pctPreUso };
  }, [equipos]);

  // ─── Sedes únicas ─────────────────────────────────────────────────────────
  const sedes = useMemo(() => {
    const map = new Map<string, string>();
    for (const eq of equipos) {
      if (eq.sucursal) map.set(eq.sucursal.id, eq.sucursal.nombre);
    }
    return Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }, [equipos]);

  // ─── Equipos filtrados ────────────────────────────────────────────────────
  const equiposFiltrados = useMemo(() => {
    let lista = equipos;
    if (filtroRapido === 'VENCIDOS_OBSERVADOS') {
      lista = lista.filter(eq => {
        const es = derivarEstadoSeguridad(eq);
        return es === 'INMOVILIZADO' || es === 'OBSERVADO';
      });
    } else if (filtroRapido === 'LOTO_ACTIVO') {
      lista = lista.filter(eq => tieneLoToActivo(eq));
    } else if (filtroRapido === 'SEDE' && filtroSede) {
      lista = lista.filter(eq => eq.sucursal?.id === filtroSede);
    }
    return lista;
  }, [equipos, filtroRapido, filtroSede]);

  const toggleFiltro = (f: FiltroRapido) => {
    if (filtroRapido === f) { setFiltroRapido(''); setFiltroSede(''); }
    else { setFiltroRapido(f); if (f !== 'SEDE') setFiltroSede(''); }
  };

  const iniciarEscaneoNfc = async () => {
    setModalNfc(true);
    const tagId = await leerNfc();
    if (tagId) {
      try {
        const equipoNfc = await equiposService.obtenerPorNfc(tagId);
        setModalNfc(false);
        navigate(`/equipos/${equipoNfc.id}`);
      } catch (err: any) {
        setModalNfc(false);
        alert(err.response?.data?.message || 'Tag NFC no pertenece a ningún equipo.');
      }
    }
  };

  // ─── Helpers de Fila ──────────────────────────────────────────────────────
  function estiloFila(estadoSeg: EstadoSeguridad) {
    switch (estadoSeg) {
      case 'INMOVILIZADO': return {
        bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', opacity: '0.85',
      };
      case 'BLOQUEADO_LOTO': return {
        bg: 'rgba(120,120,120,0.08)', border: 'rgba(120,120,120,0.15)', opacity: '0.75',
      };
      default: return { bg: 'transparent', border: 'var(--color-borde)', opacity: '1' };
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="w-7 h-7" style={{ color: 'var(--color-peligro-500)' }} />
            Control de Equipos — Riesgo Operativo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && equipos.length === 0 ? 'Cargando...' : `${equipos.length} equipos · ISO 45001 / SUNAFIL`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {soportado && (
            <button onClick={iniciarEscaneoNfc} disabled={leyendo}
              className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg border font-medium text-sm transition-all hover:bg-white/[0.05] active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: 'var(--color-primary-500)', color: 'var(--color-primary-400)' }}>
              <Wifi className="w-4 h-4" /> Escanear NFC
            </button>
          )}
          <button onClick={() => setMostrarWizard(true)}
            className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        </div>
      </div>

      {/* ─── KPIs de Cabecera ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          titulo="Peligro Inminente"
          valor={kpis.peligro}
          subtitulo="Vencidos / Inmovilizados"
          icono={AlertTriangle}
          bgColor="rgba(239,68,68,0.1)"
          textColor="#dc2626"
          iconColor="#ef4444"
          onClick={() => toggleFiltro('VENCIDOS_OBSERVADOS')}
          activo={filtroRapido === 'VENCIDOS_OBSERVADOS'}
        />
        <KpiCard
          titulo="Equipos bajo LOTO"
          valor={kpis.loto}
          subtitulo="Bloqueados / Desenergizados"
          icono={Lock}
          bgColor="rgba(30,30,30,0.85)"
          textColor="#fbbf24"
          iconColor="#fbbf24"
          onClick={() => toggleFiltro('LOTO_ACTIVO')}
          activo={filtroRapido === 'LOTO_ACTIVO'}
        />
        <KpiCard
          titulo="Vence en 7 Días"
          valor={kpis.vence7d}
          subtitulo="Calibraciones / Mant."
          icono={Clock}
          bgColor="rgba(245,158,11,0.12)"
          textColor="#b45309"
          iconColor="#f59e0b"
        />
        <KpiCard
          titulo="Pre-Uso al Día"
          valor={`${kpis.pctPreUso}%`}
          subtitulo={`${kpis.conPreUsoHoy} de ${equipos.length} hoy`}
          icono={ClipboardCheck}
          bgColor={kpis.pctPreUso >= 95 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)'}
          textColor={kpis.pctPreUso >= 95 ? '#16a34a' : '#dc2626'}
          iconColor={kpis.pctPreUso >= 95 ? '#22c55e' : '#ef4444'}
        />
      </div>

      {/* ─── NFC Modal ───────────────────────────────────────────────────── */}
      {modalNfc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center animate-fade-in">
          <Wifi className={`w-24 h-24 mb-6 ${leyendo ? 'text-blue-500 animate-ping' : 'text-red-500'}`} />
          <h2 className="text-2xl font-black text-white mb-2">Escáner NFC Activo</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-sm">
            {nfcError || 'Acerque la zona superior trasera de su teléfono al Tag NFC del equipo.'}
          </p>
          <button onClick={() => { cancelarLectura(); setModalNfc(false); }}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition">
            Cancelar / Volver
          </button>
        </div>
      )}

      {/* ─── Drawer Alta de Equipo ────────────────────────────────────── */}
      <AltaEquipoWizard
        abierto={mostrarWizard}
        onCerrar={() => setMostrarWizard(false)}
        onCreado={() => { setMostrarWizard(false); cargarDatos(); }}
      />

      {/* ─── Búsqueda + Estado + Filtros Pill ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por tag, nombre o serie..."
              className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
              style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
          </div>
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none appearance-none transition"
              style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
              <option value="">Todos los estados</option>
              <option value="OPERATIVO">Operativo</option>
              <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
              <option value="BAJA_TECNICA">Baja Técnica</option>
            </select>
          </div>
        </div>

        {/* Pill Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <button type="button" onClick={() => toggleFiltro('VENCIDOS_OBSERVADOS')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold border transition-all active:scale-95
              ${filtroRapido === 'VENCIDOS_OBSERVADOS'
                ? 'bg-red-600 text-white border-red-600'
                : 'border-red-400/40 text-red-500 hover:bg-red-500/10'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> Ver Vencidos / Observados
          </button>
          <button type="button" onClick={() => toggleFiltro('LOTO_ACTIVO')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold border transition-all active:scale-95
              ${filtroRapido === 'LOTO_ACTIVO'
                ? 'bg-gray-800 text-yellow-400 border-gray-700'
                : 'border-gray-500/40 text-gray-400 hover:bg-gray-500/10'}`}>
            <Lock className="w-3.5 h-3.5" /> Solo LOTO Activo
          </button>
          <button type="button" onClick={() => toggleFiltro('SEDE')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold border transition-all active:scale-95
              ${filtroRapido === 'SEDE'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-blue-400/40 text-blue-400 hover:bg-blue-500/10'}`}>
            <Building2 className="w-3.5 h-3.5" /> Filtrar por Sede
          </button>

          {filtroRapido === 'SEDE' && (
            <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)}
              className="px-3 py-2 min-h-[44px] rounded-full text-xs font-medium border outline-none appearance-none transition"
              style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
              <option value="">Seleccionar sede…</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          )}

          {filtroRapido && (
            <button type="button" onClick={() => { setFiltroRapido(''); setFiltroSede(''); }}
              className="text-xs underline ml-1" style={{ color: 'var(--color-texto-tenue)' }}>
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* ─── Tabla / Cards ───────────────────────────────────────────────── */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-loader p-4 rounded-xl border flex flex-col gap-3 h-[160px]" />
          ))}
        </div>
      ) : equiposFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>
            {filtroRapido ? 'Ningún equipo coincide con el filtro activo' : 'No se encontraron equipos'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Vista Móvil (Tarjetas de Seguridad) ──────────────────────── */}
          <div className="grid grid-cols-1 md:hidden gap-3">
            {equiposFiltrados.map(eq => {
              const estadoSeg = derivarEstadoSeguridad(eq);
              const badge = SEGURIDAD_BADGE[estadoSeg];
              const riesgo = derivarNivelRiesgo(eq);
              const rb = RIESGO_BADGE[riesgo];
              const venc = textoVencimiento(fechaVencimientoLegal(eq));
              const preUso = ultimoPreUso(eq);
              const fila = estiloFila(estadoSeg);

              return (
                <div key={eq.id}
                  className="p-4 rounded-xl border flex flex-col gap-2.5 transition-colors cursor-pointer active:scale-[0.99]"
                  style={{ borderColor: fila.border, backgroundColor: fila.bg, opacity: fila.opacity }}
                  onClick={() => navigate(`/equipos/${eq.id}`)}>

                  {/* Fila 1: Tag + Estado + Chevron */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {tieneEnergiaPeligrosa(eq) && <Zap className="w-4 h-4 shrink-0 text-amber-500" />}
                      {estadoSeg === 'BLOQUEADO_LOTO' && <Lock className="w-4 h-4 shrink-0 text-yellow-500" />}
                      {estadoSeg === 'INMOVILIZADO' && <Ban className="w-4 h-4 shrink-0 text-red-500" />}
                      <span className="font-black text-base truncate">{eq.nombre}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                  </div>

                  {/* Fila 2: Código + Sede */}
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                    <span className="font-mono font-bold">SN: {eq.numeroSerie}</span>
                    {eq.sucursal && <span className="truncate ml-2">{eq.sucursal.nombre}</span>}
                  </div>

                  {/* Fila 3: Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.color }}>
                      <badge.icono className="w-3 h-3" /> {badge.label}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black"
                      style={{ backgroundColor: rb.bg, color: rb.color }}>
                      {rb.label}
                    </span>
                  </div>

                  {/* Fila 4: Vencimiento + Pre-Uso */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: 'var(--color-borde)' }}>
                    {venc ? (
                      <span className="font-semibold" style={{ color: venc.color }}>{venc.texto}</span>
                    ) : (
                      <span style={{ color: 'var(--color-texto-tenue)' }}>Sin vencimiento</span>
                    )}
                    <span style={{ color: 'var(--color-texto-tenue)' }}>Pre-uso: {formatFechaHora(preUso)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Vista Desktop (Tabla de Prevención) ──────────────────────── */}
          <div className="hidden md:block rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--color-borde)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-fondo-card)' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>Tag / Código</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>Estado de Seguridad</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>Vencimiento Legal</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>Nivel de Riesgo</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>Último Pre-Uso</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.map(eq => {
                  const estadoSeg = derivarEstadoSeguridad(eq);
                  const badge = SEGURIDAD_BADGE[estadoSeg];
                  const riesgo = derivarNivelRiesgo(eq);
                  const rb = RIESGO_BADGE[riesgo];
                  const fechaVenc = fechaVencimientoLegal(eq);
                  const venc = textoVencimiento(fechaVenc);
                  const preUso = ultimoPreUso(eq);
                  const fila = estiloFila(estadoSeg);

                  return (
                    <tr key={eq.id}
                      className="border-t cursor-pointer transition-colors hover:brightness-110"
                      style={{ borderColor: fila.border, backgroundColor: fila.bg, opacity: Number(fila.opacity) }}
                      onClick={() => navigate(`/equipos/${eq.id}`)}>

                      {/* Tag / Código */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tieneEnergiaPeligrosa(eq) && (
                            <span title="Energía peligrosa"><Zap className="w-4 h-4 text-amber-500 shrink-0" /></span>
                          )}
                          {estadoSeg === 'INMOVILIZADO' && (
                            <span title="NO OPERAR"><Ban className="w-4 h-4 text-red-500 shrink-0" /></span>
                          )}
                          {estadoSeg === 'BLOQUEADO_LOTO' && (
                            <span title="LOTO Activo"><Lock className="w-4 h-4 text-yellow-500 shrink-0" /></span>
                          )}
                          <div>
                            <span className="font-bold block">{eq.nombre}</span>
                            <span className="text-[11px] font-mono block" style={{ color: 'var(--color-texto-tenue)' }}>
                              SN: {eq.numeroSerie}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Estado de Seguridad */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.color }}>
                          <badge.icono className="w-3.5 h-3.5" /> {badge.label}
                        </span>
                      </td>

                      {/* Vencimiento Legal */}
                      <td className="px-4 py-3">
                        {venc ? (
                          <div>
                            <span className="text-xs font-bold block" style={{ color: venc.color }}>{venc.texto}</span>
                            <span className="text-[11px] block" style={{ color: 'var(--color-texto-tenue)' }}>
                              {formatFechaCorta(fechaVenc)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Sin registro</span>
                        )}
                      </td>

                      {/* Nivel de Riesgo */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide"
                          style={{ backgroundColor: rb.bg, color: rb.color }}>
                          {rb.label}
                        </span>
                      </td>

                      {/* Último Pre-Uso */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: preUso ? 'var(--color-texto-principal)' : 'var(--color-texto-tenue)' }}>
                          {formatFechaHora(preUso)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
