// Expediente 360° del Equipo — v2.0.0
// Diseño: HSE-auditor-ux + UI-frontend | Sistema HSE | Marzo 2026
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  equiposService,
  type Equipo,
  type Mantenimiento,
  type AutorizacionOperador,
  type EjecucionLoto,
  type Calibracion,
} from '../../services/equipos.service';
import {
  ArrowLeft, Wrench, CheckCircle, Pause, AlertTriangle,
  Plus, Calendar, FileText, Edit3, Save, X, Trash2, Wifi,
  Shield, Zap, Lock, Unlock, Settings, Users, ClipboardCheck,
  FlaskConical, MapPin, Building2, Clock, Activity,
  Truck, Hammer, Layers, Tag, UserCheck, UserX, UserMinus,
  Info, Package, ExternalLink, ChevronRight,
} from 'lucide-react';
import { useNfcReader } from '../../hooks/useNfcReader';

// ─── Lookup tables ─────────────────────────────────────────────────────────────
const ESTADO_EQUIPO: Record<string, { label: string; color: string; bg: string; Icono: typeof CheckCircle }> = {
  OPERATIVO:        { label: 'Operativo',        color: 'var(--color-exito-500)',        bg: 'rgba(34,197,94,0.15)',   Icono: CheckCircle },
  EN_MANTENIMIENTO: { label: 'En Mantenimiento',  color: 'var(--color-advertencia-500)',  bg: 'rgba(245,158,11,0.15)',  Icono: Settings    },
  BAJA_TECNICA:     { label: 'Baja Técnica',      color: 'var(--color-peligro-500)',      bg: 'rgba(239,68,68,0.15)',   Icono: Trash2      },
};

const TIPO_EQUIPO_META: Record<string, { label: string; Icono: typeof Wrench }> = {
  MAQUINARIA_PESADA: { label: 'Maquinaria Pesada',    Icono: Truck    },
  HERRAMIENTA_PODER: { label: 'Herramienta de Poder', Icono: Zap      },
  EQUIPO_MEDICION:   { label: 'Equipo de Medición',   Icono: Activity },
  VEHICULO:          { label: 'Vehículo',              Icono: Truck    },
  EQUIPO_PRESION:    { label: 'Equipo a Presión',      Icono: Layers   },
  HERRAMIENTA_MENOR: { label: 'Herramienta Menor',     Icono: Hammer   },
};

const ESTADO_AUTORIZACION: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)'  },
  AUTORIZADO: { label: 'Autorizado', color: 'var(--color-exito-500)',        bg: 'rgba(34,197,94,0.15)'   },
  SUSPENDIDO: { label: 'Suspendido', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)'  },
  REVOCADO:   { label: 'Revocado',   color: 'var(--color-peligro-500)',      bg: 'rgba(239,68,68,0.15)'   },
};

const TIPO_MANT_META: Record<string, { label: string; color: string; bg: string }> = {
  PREVENTIVO: { label: 'Preventivo', color: 'var(--color-exito-500)',        bg: 'rgba(34,197,94,0.12)'   },
  CORRECTIVO: { label: 'Correctivo', color: 'var(--color-peligro-500)',       bg: 'rgba(239,68,68,0.12)'   },
  PREDICTIVO: { label: 'Predictivo', color: 'var(--color-primary-400)',       bg: 'rgba(59,130,246,0.12)'  },
  OVERHAUL:   { label: 'Overhaul',   color: 'var(--color-advertencia-500)',  bg: 'rgba(245,158,11,0.12)'  },
};

const ESTADO_CAL_META: Record<string, { label: string; color: string; bg: string }> = {
  CONFORME:     { label: 'Conforme',     color: 'var(--color-exito-500)',        bg: 'rgba(34,197,94,0.12)'  },
  NO_CONFORME:  { label: 'No Conforme',  color: 'var(--color-peligro-500)',       bg: 'rgba(239,68,68,0.12)'  },
  CONDICIONADO: { label: 'Condicionado', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.12)' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function diasHasta(fecha?: string): { dias: number; color: string; texto: string } | null {
  if (!fecha) return null;
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)   return { dias: diff, color: 'var(--color-peligro-500)',       texto: `Vencida hace ${Math.abs(diff)}d` };
  if (diff <= 30) return { dias: diff, color: 'var(--color-advertencia-500)',  texto: `${diff}d para vencer` };
  return             { dias: diff, color: 'var(--color-exito-500)',        texto: `${diff}d restantes` };
}

function fmt(fecha?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-PE', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: 'var(--color-borde)' }}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      className="p-4 rounded-xl border space-y-3"
      style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

// ─── Semáforo de calibración ──────────────────────────────────────────────────
function SemaforoCalibracion({ proximaCalibracion }: { proximaCalibracion?: string }) {
  const info = diasHasta(proximaCalibracion);
  const lights = [
    { id: 'rojo',     active: !info || info.dias < 0,                         color: '#ef4444' },
    { id: 'amarillo', active: !!info && info.dias >= 0 && info.dias <= 30,    color: '#f59e0b' },
    { id: 'verde',    active: !!info && info.dias > 30,                       color: '#22c55e' },
  ];
  return (
    <div className="flex flex-col items-center gap-1.5" title={info?.texto ?? 'Sin calibración registrada'}>
      <div
        className="rounded-xl p-2 flex flex-col gap-1.5 border"
        style={{ backgroundColor: '#0c1222', borderColor: 'var(--color-borde)' }}
      >
        {lights.map(l => (
          <div
            key={l.id}
            className="w-5 h-5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: l.active ? l.color : '#1e293b',
              boxShadow: l.active ? `0 0 8px ${l.color}80` : 'none',
            }}
          />
        ))}
      </div>
      <p
        className="text-[10px] text-center font-bold leading-tight"
        style={{ color: info?.color ?? 'var(--color-texto-tenue)' }}
      >
        {info ? info.texto : 'S/calibración'}
      </p>
    </div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function InfoRow({
  icono, label, value,
}: {
  icono: React.ReactNode; label: string; value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0" style={{ color: 'var(--color-texto-tenue)' }}>{icono}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-texto-tenue)' }}>{label}</p>
        <div className="text-sm font-semibold" style={{ color: 'var(--color-texto-principal)' }}>{value ?? '—'}</div>
      </div>
    </div>
  );
}

function FichaRow({
  label, value, mono, valueColor,
}: {
  label: string; value: React.ReactNode; mono?: boolean; valueColor?: string;
}) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-texto-tenue)' }}>{label}</p>
      <div
        className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
        style={{ color: valueColor ?? 'var(--color-texto-principal)' }}
      >
        {value ?? '—'}
      </div>
    </div>
  );
}

function Section({
  title, icono, children, danger = false,
}: {
  title: string; icono: React.ReactNode; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{
        backgroundColor: 'var(--color-fondo-card)',
        borderColor: danger ? 'rgba(239,68,68,0.35)' : 'var(--color-borde)',
      }}
    >
      <h3 className="font-bold text-base flex items-center gap-2">{icono}{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ icono, mensaje }: { icono: React.ReactNode; mensaje: string }) {
  return (
    <div className="text-center py-12 space-y-3">
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-fondo-card)', color: 'var(--color-texto-tenue)' }}
      >
        {icono}
      </div>
      <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>{mensaje}</p>
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type Pestana = 'ficha' | 'operadores' | 'mantenimiento' | 'inspecciones' | 'calibraciones';

// ─── Main component ───────────────────────────────────────────────────────────
export default function PaginaDetalleEquipo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana>('ficha');

  // Edit
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState<Partial<Equipo>>({});
  const [guardando, setGuardando] = useState(false);

  // Calibration form
  const [mostrarFormCal, setMostrarFormCal] = useState(false);
  const [formCal, setFormCal] = useState({
    fechaCalibracion: '', proximaCalibracion: '',
    observaciones: '', entidadCertificadora: '', numeroCertificado: '',
  });
  const [guardandoCal, setGuardandoCal] = useState(false);

  // Deactive
  const [desactivando, setDesactivando] = useState(false);

  // NFC
  const { leerNfc, cancelarLectura, error: nfcError, soportado } = useNfcReader();
  const [modalNfc, setModalNfc] = useState(false);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const lotoActivo = equipo?.requiereLoto && equipo?.ejecucionesLoto?.some(e => e.estadoEjecucion === 'BLOQUEADO');
  const proximaCal = equipo?.calibraciones?.[0]?.proximaCalibracion;

  // ─── Data ─────────────────────────────────────────────────────────────────
  const cargar = () => {
    if (!id) return;
    setCargando(true);
    equiposService.obtenerPorId(id)
      .then(data => { setEquipo(data); setFormEdit(data); })
      .catch(() => navigate('/equipos'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [id]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const guardarCambios = async () => {
    if (!id) return;
    setGuardando(true);
    try {
      await equiposService.actualizar(id, {
        marca: formEdit.marca || undefined,
        modelo: formEdit.modelo || undefined,
        descripcion: formEdit.descripcion || undefined,
        ubicacionFisica: formEdit.ubicacionFisica || undefined,
      });
      setEditando(false);
      cargar();
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  };

  const agregarCalibracion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setGuardandoCal(true);
    try {
      await equiposService.agregarCalibracion({
        equipoId: id,
        fechaCalibracion: formCal.fechaCalibracion,
        proximaCalibracion: formCal.proximaCalibracion,
        observaciones: formCal.observaciones || undefined,
      });
      setMostrarFormCal(false);
      setFormCal({ fechaCalibracion: '', proximaCalibracion: '', observaciones: '', entidadCertificadora: '', numeroCertificado: '' });
      cargar();
    } catch (err) { console.error(err); }
    finally { setGuardandoCal(false); }
  };

  const manejarDesactivar = async () => {
    if (!id || equipo?.estado === 'BAJA_TECNICA') return;
    if (!window.confirm(`¿Confirma dar de baja técnica al equipo "${equipo?.nombre}"?`)) return;
    setDesactivando(true);
    try { await equiposService.desactivar(id); cargar(); }
    catch (err) { console.error(err); }
    finally { setDesactivando(false); }
  };

  const vincularNfc = async () => {
    if (!id || !soportado) return;
    setModalNfc(true);
    const tag = await leerNfc();
    if (tag) {
      try {
        await equiposService.actualizar(id, { nfcTagId: tag });
        setModalNfc(false);
        cargar();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al vincular NFC.');
        setModalNfc(false);
      }
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }
  if (!equipo) return null;

  const estadoBadge     = ESTADO_EQUIPO[equipo.estado] ?? ESTADO_EQUIPO['OPERATIVO'];
  const tipoMeta        = TIPO_EQUIPO_META[equipo.tipoEquipo ?? 'HERRAMIENTA_MENOR'] ?? TIPO_EQUIPO_META['HERRAMIENTA_MENOR'];
  const TipoIcono       = tipoMeta.Icono;

  const tabs: { key: Pestana; label: string; icono: React.ReactNode }[] = [
    { key: 'ficha',         label: 'Ficha Técnica',                                          icono: <FileText className="w-4 h-4" />      },
    { key: 'operadores',    label: `Operadores (${equipo.autorizaciones?.length ?? 0})`,     icono: <Users className="w-4 h-4" />         },
    { key: 'mantenimiento', label: `Mant. & LOTO (${equipo.mantenimientos?.length ?? 0})`,   icono: <Wrench className="w-4 h-4" />        },
    { key: 'inspecciones',  label: `Inspecciones (${equipo.inspecciones?.length ?? 0})`,     icono: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'calibraciones', label: `Calibraciones INACAL (${equipo.calibraciones?.length ?? 0})`, icono: <FlaskConical className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ══ BANNER LOTO DE ALTA VISIBILIDAD ══════════════════════════════════ */}
      {lotoActivo && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-xl border-2"
          style={{
            background: 'repeating-linear-gradient(45deg, #0a0005, #0a0005 14px, #1a0000 14px, #1a0000 28px)',
            borderColor: '#ef4444',
          }}
        >
          <div className="flex items-center gap-1.5 shrink-0 animate-pulse">
            <Lock className="w-8 h-8 text-red-500" />
            <Lock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-400 font-black text-base sm:text-lg tracking-widest uppercase leading-tight">
              ⚠ PELIGRO: EQUIPO BLOQUEADO — ENERGÍA CERO
            </p>
            <p className="text-red-300/70 text-xs sm:text-sm mt-1">
              Procedimiento LOTO activo · No retirar candados sin autorización del Coordinador HSE
            </p>
          </div>
          {equipo.energiasPeligrosas && equipo.energiasPeligrosas.length > 0 && (
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-yellow-400 font-black text-xs uppercase tracking-wider">LOTO ACTIVO</p>
              <p className="text-red-400/60 text-xs mt-0.5">{equipo.energiasPeligrosas.join(' · ')}</p>
            </div>
          )}
        </div>
      )}

      {/* ══ BACK ════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => navigate('/equipos')}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white min-h-[44px] -ml-1 px-1"
        style={{ color: 'var(--color-texto-secundario)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Equipos
      </button>

      {/* ══ 2-COLUMN LAYOUT ════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ─────────── LEFT COLUMN — Identity card ─────────── */}
        <div className="lg:w-[280px] shrink-0 space-y-3">
          <div
            className="rounded-xl border p-5 space-y-4"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
          >
            {/* Type icon + name */}
            <div className="text-center space-y-2">
              <div
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))' }}
              >
                <TipoIcono className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-xl font-bold leading-tight">{equipo.nombre}</h1>
              <p className="text-xs font-mono" style={{ color: 'var(--color-texto-tenue)' }}>
                S/N: {equipo.numeroSerie}
              </p>
            </div>

            {/* Estado badge */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: estadoBadge.bg, color: estadoBadge.color }}
              >
                <estadoBadge.Icono className="w-4 h-4" />
                {estadoBadge.label}
              </span>
            </div>

            {/* Semáforo calibración */}
            <div
              className="flex items-center gap-4 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-fondo-principal)' }}
            >
              <SemaforoCalibracion proximaCalibracion={proximaCal} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
                  Próx. Calibración
                </p>
                <p className="text-sm font-bold">{fmt(proximaCal)}</p>
                {proximaCal && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: diasHasta(proximaCal)?.color ?? 'var(--color-texto-tenue)' }}
                  >
                    {diasHasta(proximaCal)?.texto}
                  </p>
                )}
              </div>
            </div>

            {/* Key stats */}
            <div className="space-y-3 text-sm border-t pt-4" style={{ borderColor: 'var(--color-borde)' }}>
              <InfoRow icono={<Tag className="w-4 h-4" />}       label="Tipo"        value={tipoMeta.label} />
              <InfoRow icono={<Building2 className="w-4 h-4" />} label="Sucursal"    value={equipo.sucursal?.nombre ?? '—'} />
              <InfoRow
                icono={<MapPin className="w-4 h-4" />}
                label="Ubicación"
                value={
                  editando
                    ? (
                      <input
                        value={formEdit.ubicacionFisica || ''}
                        onChange={e => setFormEdit({ ...formEdit, ubicacionFisica: e.target.value })}
                        className="w-full bg-transparent border-b outline-none text-sm"
                        style={{ borderColor: 'var(--color-borde)' }}
                        placeholder="Ej: Almacén Zona Norte"
                      />
                    )
                    : (equipo.ubicacionFisica ?? '—')
                }
              />
              {equipo.horasOperadasActuales != null && (
                <InfoRow
                  icono={<Clock className="w-4 h-4" />}
                  label="Horas Operadas"
                  value={`${equipo.horasOperadasActuales.toLocaleString('es-PE')} h`}
                />
              )}
              <InfoRow icono={<Calendar className="w-4 h-4" />} label="Registrado" value={fmt(equipo.creadoEn)} />
            </div>

            {/* LOTO indicator */}
            {equipo.requiereLoto && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <Lock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Requiere LOTO</p>
                  {equipo.energiasPeligrosas && equipo.energiasPeligrosas.length > 0 && (
                    <p className="text-[10px] mt-0.5 text-red-300/60 leading-tight">
                      {equipo.energiasPeligrosas.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* NFC tag */}
            {equipo.nfcTagId && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-blue-400 text-xs font-mono"
                style={{ borderColor: 'rgba(59,130,246,0.2)', backgroundColor: 'rgba(59,130,246,0.06)' }}
              >
                <Wifi className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{equipo.nfcTagId}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--color-borde)' }}>
              {!editando ? (
                <div className="flex gap-2">
                  {equipo.estado !== 'BAJA_TECNICA' && (
                    <button
                      onClick={() => setEditando(true)}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-medium border transition hover:bg-white/5"
                      style={{ borderColor: 'var(--color-borde)' }}
                    >
                      <Edit3 className="w-4 h-4 text-blue-400" /> Editar
                    </button>
                  )}
                  {soportado && equipo.estado !== 'BAJA_TECNICA' && (
                    <button
                      onClick={vincularNfc}
                      title="Vincular etiqueta NFC"
                      className="flex items-center justify-center w-11 h-11 rounded-lg border transition hover:bg-blue-500/10 text-blue-400"
                      style={{ borderColor: 'rgba(59,130,246,0.3)' }}
                    >
                      <Wifi className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={guardarCambios}
                    disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-bold text-white disabled:opacity-50 transition"
                    style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #16a34a)' }}
                  >
                    <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => { setEditando(false); setFormEdit(equipo); }}
                    className="flex items-center justify-center w-11 h-11 rounded-lg border hover:bg-white/5 transition"
                    style={{ borderColor: 'var(--color-borde)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {equipo.estado !== 'BAJA_TECNICA' && (
                <button
                  onClick={manejarDesactivar}
                  disabled={desactivando}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium transition hover:underline disabled:opacity-50 py-2"
                  style={{ color: 'var(--color-peligro-500)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {desactivando ? 'Dando de baja...' : 'Dar de Baja Técnica'}
                </button>
              )}
            </div>
          </div>

          {/* Counters quick-summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Calibr.',  value: equipo._count?.calibraciones  ?? equipo.calibraciones?.length  ?? 0, color: 'var(--color-primary-400)'      },
              { label: 'Mant.',    value: equipo._count?.mantenimientos  ?? equipo.mantenimientos?.length  ?? 0, color: 'var(--color-advertencia-500)'  },
              { label: 'Oper.',    value: equipo._count?.autorizaciones  ?? equipo.autorizaciones?.length  ?? 0, color: 'var(--color-exito-500)'        },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl p-3 text-center border"
                style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
              >
                <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─────────── RIGHT COLUMN — Tabs ─────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Tab bar */}
          <div
            className="flex overflow-x-auto gap-0.5 border-b pb-0 no-scrollbar"
            style={{ borderColor: 'var(--color-borde)' }}
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setPestana(tab.key)}
                className="flex items-center gap-2 px-4 shrink-0 text-sm font-bold transition-all border-b-2 outline-none min-h-[44px] focus:bg-white/5"
                style={
                  pestana === tab.key
                    ? { borderColor: 'var(--color-primary-500)', color: 'var(--color-texto-principal)' }
                    : { borderColor: 'transparent', color: 'var(--color-texto-secundario)' }
                }
              >
                {tab.icono}
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ══ TAB: Ficha Técnica ══════════════════════════════════════════ */}
          {pestana === 'ficha' && (
            <div className="space-y-5 pt-1">
              {/* Identidad */}
              <Section title="Identidad del Equipo" icono={<Info className="w-5 h-5 text-blue-400" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FichaRow label="Nombre" value={equipo.nombre} />
                  <FichaRow label="Número de Serie" value={equipo.numeroSerie} mono />
                  <FichaRow
                    label="Marca"
                    value={
                      editando
                        ? <input value={formEdit.marca || ''} onChange={e => setFormEdit({ ...formEdit, marca: e.target.value })} className="w-full bg-transparent border-b outline-none text-sm" style={{ borderColor: 'var(--color-borde)' }} placeholder="Marca..." />
                        : (equipo.marca ?? '—')
                    }
                  />
                  <FichaRow
                    label="Modelo"
                    value={
                      editando
                        ? <input value={formEdit.modelo || ''} onChange={e => setFormEdit({ ...formEdit, modelo: e.target.value })} className="w-full bg-transparent border-b outline-none text-sm" style={{ borderColor: 'var(--color-borde)' }} placeholder="Modelo..." />
                        : (equipo.modelo ?? '—')
                    }
                  />
                  <FichaRow label="Tipo de Equipo" value={tipoMeta.label} />
                  <FichaRow label="Estado Actual"  value={estadoBadge.label} />
                  <FichaRow label="Sucursal"        value={equipo.sucursal?.nombre ?? '—'} />
                  <FichaRow
                    label="Ubicación Física"
                    value={
                      editando
                        ? <input value={formEdit.ubicacionFisica || ''} onChange={e => setFormEdit({ ...formEdit, ubicacionFisica: e.target.value })} className="w-full bg-transparent border-b outline-none text-sm" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej: Almacén Zona Norte - Rack 3" />
                        : (equipo.ubicacionFisica ?? '—')
                    }
                  />
                </div>
                {editando && (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Descripción</label>
                    <textarea
                      value={formEdit.descripcion || ''} rows={2}
                      onChange={e => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                      style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                      placeholder="Descripción técnica..."
                    />
                  </div>
                )}
                {!editando && equipo.descripcion && (
                  <p className="text-sm px-1" style={{ color: 'var(--color-texto-secundario)' }}>{equipo.descripcion}</p>
                )}
              </Section>

              {/* Ciclo de vida */}
              <Section title="Ciclo de Vida" icono={<Activity className="w-5 h-5 text-blue-400" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <FichaRow label="Fecha Fabricación" value={fmt(equipo.fechaFabricacion)} />
                  <FichaRow label="Fecha Adquisición" value={fmt(equipo.fechaAdquisicion)} />
                  <FichaRow label="Vida Útil" value={equipo.vidaUtilMeses ? `${equipo.vidaUtilMeses} meses` : '—'} />
                  <FichaRow
                    label="Próximo Mant. Prog."
                    value={fmt(equipo.proximoMantenimiento)}
                    valueColor={
                      equipo.proximoMantenimiento && new Date(equipo.proximoMantenimiento) < new Date()
                        ? 'var(--color-peligro-500)' : undefined
                    }
                  />
                  <FichaRow label="Horas Operadas"   value={equipo.horasOperadasActuales != null   ? `${equipo.horasOperadasActuales} h`   : '—'} />
                  <FichaRow label="Límite p/Mant."   value={equipo.horasLimiteMantenimiento != null ? `${equipo.horasLimiteMantenimiento} h` : '—'} />
                </div>
              </Section>

              {/* LOTO (only when required) */}
              {equipo.requiereLoto && (
                <Section title="Configuración LOTO — OSHA 1910.147" icono={<Lock className="w-5 h-5 text-red-400" />} danger>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        <Lock className="w-3.5 h-3.5" /> LOTO Obligatorio
                      </span>
                      {lotoActivo && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black animate-pulse bg-red-600/25 text-red-300 border border-red-500/50">
                          ● CANDADO ACTIVO AHORA
                        </span>
                      )}
                    </div>
                    {equipo.puntosBloqueo && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Puntos de Bloqueo</p>
                        <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)', color: 'var(--color-texto-secundario)' }}>
                          {equipo.puntosBloqueo}
                        </p>
                      </div>
                    )}
                    {equipo.energiasPeligrosas && equipo.energiasPeligrosas.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-texto-tenue)' }}>Energías Peligrosas</p>
                        <div className="flex flex-wrap gap-2">
                          {equipo.energiasPeligrosas.map(en => (
                            <span key={en} className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                              <Zap className="w-3 h-3" /> {en}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* EPP Obligatorio */}
              {Array.isArray(equipo.eppObligatorio) && (equipo.eppObligatorio as any[]).length > 0 && (
                <Section title="EPP Obligatorio para Operación" icono={<Shield className="w-5 h-5 text-amber-400" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(equipo.eppObligatorio as any[]).map((epp, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: epp.obligatorio ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.12)' }}
                        >
                          <Shield className="w-4 h-4" style={{ color: epp.obligatorio ? 'var(--color-advertencia-500)' : 'var(--color-texto-tenue)' }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{epp.tipo}</p>
                          {epp.especificacion && <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{epp.especificacion}</p>}
                          <p className={`text-[10px] font-bold uppercase mt-1 ${epp.obligatorio ? 'text-amber-400' : 'text-gray-500'}`}>
                            {epp.obligatorio ? '✓ Obligatorio' : 'Opcional'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Manual técnico */}
              {equipo.manualUrl && (
                <Section title="Manual Técnico" icono={<FileText className="w-5 h-5 text-blue-400" />}>
                  <a
                    href={equipo.manualUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-medium transition hover:opacity-80"
                    style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: 'var(--color-primary-400)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <ExternalLink className="w-4 h-4" /> Ver Manual Técnico
                  </a>
                </Section>
              )}
            </div>
          )}

          {/* ══ TAB: Operadores Autorizados ═════════════════════════════════ */}
          {pestana === 'operadores' && (
            <div className="space-y-4 pt-1">
              {cargando ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
              ) : !equipo.autorizaciones?.length ? (
                <EmptyState icono={<Users className="w-10 h-10" />} mensaje="Sin operadores autorizados registrados para este equipo." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipo.autorizaciones.map((aut: AutorizacionOperador) => {
                    const badge    = ESTADO_AUTORIZACION[aut.estado] ?? ESTADO_AUTORIZACION['PENDIENTE'];
                    const esRiesgo = aut.estado === 'REVOCADO' || aut.estado === 'SUSPENDIDO';
                    const vencida  = aut.fechaVencimiento && new Date(aut.fechaVencimiento) < new Date();
                    const initials = aut.trabajador.nombreCompleto.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <div
                        key={aut.id}
                        className="relative p-4 rounded-xl border transition-all"
                        style={{
                          backgroundColor: 'var(--color-fondo-card)',
                          borderColor: esRiesgo ? 'rgba(239,68,68,0.35)' : 'var(--color-borde)',
                        }}
                      >
                        {/* Risk warning */}
                        {(esRiesgo || vencida) && (
                          <div className="absolute top-3 right-3">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                        )}

                        <div className="flex items-start gap-3 pr-6">
                          {/* Avatar */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                            style={{
                              background: esRiesgo ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                              color: esRiesgo ? 'var(--color-peligro-500)' : 'var(--color-primary-400)',
                            }}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight truncate">{aut.trabajador.nombreCompleto}</p>
                            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-texto-tenue)' }}>DNI: {aut.trabajador.dni}</p>
                            {/* Estado badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ backgroundColor: badge.bg, color: badge.color }}
                              >
                                {aut.estado === 'AUTORIZADO'  && <UserCheck  className="w-3 h-3" />}
                                {aut.estado === 'REVOCADO'    && <UserX      className="w-3 h-3" />}
                                {aut.estado === 'SUSPENDIDO'  && <UserMinus  className="w-3 h-3" />}
                                {badge.label}
                              </span>
                              {vencida && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">
                                  <AlertTriangle className="w-3 h-3" /> Aut. Vencida
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Habilitadores checklist */}
                        <div
                          className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center"
                          style={{ borderColor: 'var(--color-borde)' }}
                        >
                          {[
                            { label: 'Capacitación', ok: aut.capacitacionVerificada },
                            { label: 'EMO Vigente',  ok: aut.emoVigenteVerificado   },
                            { label: 'EPP',          ok: aut.eppVerificado          },
                          ].map(({ label, ok }) => (
                            <div key={label} className="space-y-1">
                              {ok
                                ? <CheckCircle className="w-4 h-4 mx-auto" style={{ color: 'var(--color-exito-500)' }} />
                                : <X          className="w-4 h-4 mx-auto" style={{ color: 'var(--color-peligro-500)' }} />
                              }
                              <p className="text-[10px] leading-tight" style={{ color: 'var(--color-texto-tenue)' }}>{label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Capacitación label */}
                        <p className="mt-2 text-xs truncate px-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
                          📋 {aut.capacitacionRequerida}
                        </p>
                        {aut.fechaVencimiento && (
                          <p className="mt-0.5 text-xs px-0.5" style={{ color: vencida ? 'var(--color-peligro-500)' : 'var(--color-texto-tenue)' }}>
                            Vence: {fmt(aut.fechaVencimiento)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Mantenimiento & LOTO ═══════════════════════════════════ */}
          {pestana === 'mantenimiento' && (
            <div className="space-y-5 pt-1">
              {/* LOTO executions sub-section */}
              <Section title="Ejecuciones LOTO" icono={<Lock className="w-5 h-5 text-red-400" />} danger={lotoActivo ?? false}>
                {cargando ? (
                  <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
                ) : !equipo.ejecucionesLoto?.length ? (
                  <p className="text-sm py-4 text-center" style={{ color: 'var(--color-texto-secundario)' }}>
                    {equipo.requiereLoto ? 'Sin ejecuciones LOTO registradas aún.' : 'Este equipo no requiere procedimiento LOTO.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {equipo.ejecucionesLoto.map((loto: EjecucionLoto) => {
                      const activo = loto.estadoEjecucion === 'BLOQUEADO';
                      return (
                        <div
                          key={loto.id}
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ backgroundColor: 'var(--color-fondo-principal)' }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: activo ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }}
                          >
                            {activo
                              ? <Lock   className="w-4 h-4 text-red-400" />
                              : <Unlock className="w-4 h-4" style={{ color: 'var(--color-exito-500)' }} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{loto.motivoBloqueo}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
                              Bloqueado: {fmt(loto.fechaBloqueo)}
                              {loto.fechaDesbloqueo ? ` → Desbloqueado: ${fmt(loto.fechaDesbloqueo)}` : ''}
                            </p>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0"
                            style={{
                              backgroundColor: activo ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                              color: activo ? 'var(--color-peligro-500)' : 'var(--color-exito-500)',
                            }}
                          >
                            {loto.estadoEjecucion}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Maintenance history */}
              <Section title="Historial de Mantenimiento" icono={<Wrench className="w-5 h-5 text-blue-400" />}>
                {cargando ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
                ) : !equipo.mantenimientos?.length ? (
                  <EmptyState icono={<Settings className="w-10 h-10" />} mensaje="Sin intervenciones de mantenimiento registradas." />
                ) : (
                  <div className="space-y-3">
                    {equipo.mantenimientos.map((mant: Mantenimiento) => {
                      const meta = TIPO_MANT_META[mant.tipoMantenimiento] ?? TIPO_MANT_META['CORRECTIVO'];
                      return (
                        <div
                          key={mant.id}
                          className="p-4 rounded-xl border"
                          style={{ backgroundColor: 'var(--color-fondo-principal)', borderColor: 'var(--color-borde)' }}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: meta.bg }}
                              >
                                <Settings className="w-5 h-5" style={{ color: meta.color }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold">{fmt(mant.fechaMantenimiento)}</span>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                                    style={{ backgroundColor: meta.bg, color: meta.color }}
                                  >
                                    {meta.label}
                                  </span>
                                  {mant.equipoFueraServicio && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400">
                                      Fuera de Servicio
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
                                  Técnico: {mant.tecnicoResponsable}
                                  {mant.proveedorServicio ? ` · ${mant.proveedorServicio}` : ''}
                                </p>
                              </div>
                            </div>
                            {mant.costoSoles != null && (
                              <div className="text-right ml-auto shrink-0">
                                <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-texto-tenue)' }}>Costo</p>
                                <p className="text-sm font-bold">S/ {mant.costoSoles.toLocaleString('es-PE')}</p>
                              </div>
                            )}
                          </div>

                          <p className="mt-3 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>{mant.trabajoRealizado}</p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {mant.horasEquipoAlMomento != null && (
                              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-texto-tenue)' }}>
                                <Clock className="w-3 h-3" /> {mant.horasEquipoAlMomento} h al momento
                              </p>
                            )}
                            {mant.repuestosUsados && (
                              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-texto-tenue)' }}>
                                <Package className="w-3 h-3" /> {mant.repuestosUsados}
                              </p>
                            )}
                          </div>

                          {mant.certificadoUrl && (
                            <a
                              href={mant.certificadoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
                            >
                              <ExternalLink className="w-3 h-3" /> Ver Orden de Trabajo
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ══ TAB: Inspecciones ═══════════════════════════════════════════ */}
          {pestana === 'inspecciones' && (
            <div className="space-y-4 pt-1">
              {cargando ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
              ) : !equipo.inspecciones?.length ? (
                <EmptyState
                  icono={<ClipboardCheck className="w-10 h-10" />}
                  mensaje="Sin inspecciones vinculadas a este equipo. Las inspecciones de campo aparecerán aquí automáticamente."
                />
              ) : (
                <div className="space-y-3">
                  {equipo.inspecciones.map((insp: any) => (
                    <div
                      key={insp.id}
                      className="flex items-center gap-3 p-4 rounded-xl border"
                      style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
                    >
                      <ClipboardCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--color-primary-400)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{insp.tipoInspeccion ?? 'Inspección'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{fmt(insp.creadoEn)}</p>
                      </div>
                      {insp.resultado && (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: insp.resultado === 'CONFORME' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: insp.resultado === 'CONFORME' ? 'var(--color-exito-500)' : 'var(--color-peligro-500)',
                          }}
                        >
                          {insp.resultado}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Calibraciones INACAL ═══════════════════════════════════ */}
          {pestana === 'calibraciones' && (
            <div className="space-y-5 pt-1">
              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FlaskConical className="w-5 h-5" style={{ color: 'var(--color-primary-400)' }} />
                  Historial de Calibraciones INACAL
                </h3>
                <button
                  onClick={() => setMostrarFormCal(!mostrarFormCal)}
                  className="flex items-center gap-2 px-3 min-h-[44px] rounded-lg text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
                >
                  <Plus className="w-4 h-4" /> Nueva Calibración
                </button>
              </div>

              {/* Form */}
              {mostrarFormCal && (
                <form
                  onSubmit={agregarCalibracion}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border animate-fade-in"
                  style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
                >
                  {[
                    { key: 'fechaCalibracion',    label: 'Fecha Calibración *',  type: 'date',  required: true,  placeholder: '' },
                    { key: 'proximaCalibracion',  label: 'Próxima Calibración *', type: 'date', required: true,  placeholder: '' },
                    { key: 'entidadCertificadora', label: 'Entidad Certificadora', type: 'text', required: false, placeholder: 'INACAL, SGS, Bureau Veritas...' },
                    { key: 'numeroCertificado',   label: 'Nº Certificado',        type: 'text', required: false, placeholder: 'Nº de serie del certificado...' },
                  ].map(campo => (
                    <div key={campo.key}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                        {campo.label}
                      </label>
                      <input
                        type={campo.type}
                        required={campo.required}
                        placeholder={campo.placeholder}
                        value={(formCal as any)[campo.key]}
                        onChange={e => setFormCal({ ...formCal, [campo.key]: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition"
                        style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Observaciones</label>
                    <input
                      value={formCal.observaciones}
                      placeholder="Observaciones técnicas del resultado..."
                      onChange={e => setFormCal({ ...formCal, observaciones: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none"
                      style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setMostrarFormCal(false)}
                      className="px-4 py-2 text-sm rounded-lg hover:bg-white/5 transition min-h-[40px]"
                      style={{ color: 'var(--color-texto-secundario)' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoCal}
                      className="px-5 py-2 text-sm rounded-lg text-white font-bold disabled:opacity-50 transition min-h-[40px]"
                      style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}
                    >
                      {guardandoCal ? 'Guardando...' : 'Guardar Calibración'}
                    </button>
                  </div>
                </form>
              )}

              {/* List */}
              {cargando ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
              ) : !equipo.calibraciones?.length ? (
                <EmptyState icono={<FlaskConical className="w-10 h-10" />} mensaje="Sin calibraciones registradas. Use el botón para agregar la primera." />
              ) : (
                <div className="space-y-3">
                  {equipo.calibraciones.map((cal: Calibracion, idx: number) => {
                    const vencida      = new Date(cal.proximaCalibracion) < new Date();
                    const esMasReciente = idx === 0;
                    const calMeta      = ESTADO_CAL_META[cal.estadoResultado ?? 'CONFORME'] ?? ESTADO_CAL_META['CONFORME'];
                    return (
                      <div
                        key={cal.id}
                        className="p-4 rounded-xl border"
                        style={{
                          backgroundColor: 'var(--color-fondo-card)',
                          borderColor: vencida ? 'rgba(239,68,68,0.35)' : esMasReciente ? 'rgba(59,130,246,0.35)' : 'var(--color-borde)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: vencida ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }}
                            >
                              {vencida
                                ? <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-peligro-500)' }} />
                                : <CheckCircle   className="w-5 h-5" style={{ color: 'var(--color-exito-500)'   }} />
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {esMasReciente && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-primary-500/20 text-primary-400 uppercase tracking-wide">
                                    Última
                                  </span>
                                )}
                                <p className="font-bold text-sm">{fmt(cal.fechaCalibracion, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                              {cal.entidadCertificadora && (
                                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-texto-tenue)' }}>
                                  <Shield className="w-3 h-3" />
                                  {cal.entidadCertificadora}
                                  {cal.numeroCertificado && ` — Cert. ${cal.numeroCertificado}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                              style={{ backgroundColor: calMeta.bg, color: calMeta.color }}
                            >
                              {calMeta.label}
                            </span>
                            <p className="text-[10px]" style={{ color: 'var(--color-texto-tenue)' }}>Próxima:</p>
                            <p
                              className="text-sm font-bold"
                              style={{ color: vencida ? 'var(--color-peligro-500)' : 'var(--color-texto-principal)' }}
                            >
                              {fmt(cal.proximaCalibracion)} {vencida ? '⚠' : ''}
                            </p>
                          </div>
                        </div>

                        {cal.observaciones && (
                          <p className="mt-3 text-xs px-0.5" style={{ color: 'var(--color-texto-secundario)' }}>{cal.observaciones}</p>
                        )}
                        {cal.certificadoUrl && (
                          <a
                            href={cal.certificadoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver Certificado INACAL
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>{/* end right column */}
      </div>{/* end 2-col layout */}

      {/* ══ NFC MODAL ════════════════════════════════════════════════════════ */}
      {modalNfc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="rounded-2xl p-8 text-center max-w-sm w-full mx-4 border"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
          >
            <Wifi className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-bounce" />
            <p className="font-bold text-lg">Leyendo etiqueta NFC</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-texto-secundario)' }}>
              Acerque el dispositivo a la etiqueta NFC del equipo
            </p>
            {nfcError && <p className="mt-2 text-sm text-red-400">{nfcError}</p>}
            <button
              onClick={() => { cancelarLectura(); setModalNfc(false); }}
              className="mt-6 px-6 min-h-[44px] rounded-lg text-sm font-medium border hover:bg-white/5 transition"
              style={{ borderColor: 'var(--color-borde)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
