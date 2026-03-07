import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, ExternalLink,
  AlertTriangle, Shield, ShieldCheck, ShieldAlert,
  Phone, PhoneCall, Flame, Wind, Zap,
  Users, FileText, Calendar, CheckCircle, XCircle,
  Info, HardHat, Stethoscope, ClipboardCheck,
  TriangleAlert, Siren, FlameKindling, SquareActivity,
  Clock, Award, Activity,
} from 'lucide-react';
import { sucursalesService } from '../../services/trabajadores.service';
import type {
  Sucursal, NivelRiesgo, ResultadoInspeccionSUNAFIL,
  BrigadaEmergencia, PeligroIdentificado,
} from '../../services/trabajadores.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function diasHasta(iso?: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Semáforo de Nivel de Riesgo ────────────────────────────────────────────

const RIESGO_CFG: Record<NivelRiesgo, {
  label: string; color: string; bg: string; ring: string; icon: React.ReactNode; pulse: boolean;
}> = {
  BAJO:   { label: 'Bajo',    color: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/40', icon: <ShieldCheck className="w-5 h-5" />, pulse: false },
  MEDIO:  { label: 'Medio',   color: 'text-amber-400',   bg: 'bg-amber-500/15',   ring: 'ring-amber-500/40',   icon: <Shield className="w-5 h-5" />,      pulse: false },
  ALTO:   { label: 'Alto',    color: 'text-orange-400',  bg: 'bg-orange-500/15',  ring: 'ring-orange-500/40',  icon: <ShieldAlert className="w-5 h-5" />,  pulse: false },
  CRITICO:{ label: 'Crítico', color: 'text-red-400',     bg: 'bg-red-500/15',     ring: 'ring-red-500/50',     icon: <ShieldAlert className="w-5 h-5" />,  pulse: true  },
};

function SemaforoRiesgo({ nivel }: { nivel?: NivelRiesgo | null }) {
  if (!nivel) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-gray-400">
      <Shield className="w-4 h-4" /> Sin clasificar
    </span>
  );
  const cfg = RIESGO_CFG[nivel];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring} ${cfg.pulse ? 'animate-pulse' : ''}`}>
      {cfg.icon}
      Riesgo {cfg.label}
    </span>
  );
}

// ─── Badge de alerta DC ─────────────────────────────────────────────────────

function AlertaCertificadoDC({ fecha }: { fecha?: string | null }) {
  const dias = diasHasta(fecha);
  if (dias === null) return null;

  if (dias < 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/50 animate-pulse">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-300">⚠ CERTIFICADO DC VENCIDO — RIESGO DE CIERRE INDECI</p>
          <p className="text-xs text-red-400/80">Venció hace {Math.abs(dias)} días · {formatDate(fecha)}</p>
        </div>
      </div>
    );
  }
  if (dias <= 30) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/50">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-300">Certificado DC próximo a vencer — {dias} días restantes</p>
          <p className="text-xs text-amber-400/80">Vence el {formatDate(fecha)} · Gestionar renovación INDECI</p>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Badge SUNAFIL ──────────────────────────────────────────────────────────

const SUNAFIL_CFG: Record<ResultadoInspeccionSUNAFIL, { label: string; color: string; bg: string }> = {
  CONFORME:     { label: 'Conforme',     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  OBSERVADO:    { label: 'Observado',    color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  NO_CONFORME:  { label: 'No Conforme',  color: 'text-orange-400',  bg: 'bg-orange-500/10'  },
  SANCIONADO:   { label: 'Sancionado',   color: 'text-red-400',     bg: 'bg-red-500/10'     },
};

function BadgeSUNAFIL({ resultado }: { resultado?: ResultadoInspeccionSUNAFIL | null }) {
  if (!resultado) return <span className="text-sm opacity-40">—</span>;
  const cfg = SUNAFIL_CFG[resultado];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Fila de detalle ────────────────────────────────────────────────────────

function FilaInfo({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-borde)' }}>
      <span className="text-sm shrink-0" style={{ color: 'var(--color-texto-secundario)' }}>{label}</span>
      <span className={`text-sm font-semibold text-right ${accent ? 'text-blue-400' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── Tarjeta de sección ─────────────────────────────────────────────────────

function TarjetaSeccion({ titulo, icon, children }: { titulo: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'var(--color-texto-secundario)' }}>{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-texto-tenue)' }}>{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Botón de llamada de emergencia ─────────────────────────────────────────

function BotonLlamada({ telefono, etiqueta, descripcion, colorClass = 'text-red-300', bgClass = 'bg-red-500/15', borderClass = 'border-red-500/40' }: {
  telefono?: string | null;
  etiqueta: string;
  descripcion?: string;
  colorClass?: string;
  bgClass?: string;
  borderClass?: string;
}) {
  if (!telefono) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-xl border opacity-40 cursor-not-allowed" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.3)' }}>
        <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-white/5">
          <Phone className="w-6 h-6 text-gray-500" />
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-500">{etiqueta}</p>
          {descripcion && <p className="text-xs text-gray-600">{descripcion}</p>}
          <p className="text-xs text-gray-600 mt-0.5">No registrado</p>
        </div>
      </div>
    );
  }
  return (
    <a
      href={`tel:${telefono.replace(/\s+/g, '')}`}
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all active:scale-[0.97] hover:brightness-110 ${bgClass} ${borderClass}`}
      style={{ minHeight: '64px' }}
    >
      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ring-2 ${bgClass} ${borderClass}`}>
        <PhoneCall className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base ${colorClass}`}>{etiqueta}</p>
        {descripcion && <p className="text-xs opacity-70 truncate" style={{ color: 'var(--color-texto-secundario)' }}>{descripcion}</p>}
        <p className={`text-sm font-mono font-semibold mt-0.5 ${colorClass}`}>{telefono}</p>
      </div>
      <PhoneCall className={`w-5 h-5 shrink-0 ${colorClass} opacity-60`} />
    </a>
  );
}

// ─── Grid de Brigadas (JSON) ─────────────────────────────────────────────────

const TIPO_BRIGADA_ICON: Record<string, React.ReactNode> = {
  'evacuación':  <Wind className="w-5 h-5 text-blue-400" />,
  'incendio':    <Flame className="w-5 h-5 text-orange-400" />,
  'primeros':    <Stethoscope className="w-5 h-5 text-emerald-400" />,
  'primeros auxilios': <Stethoscope className="w-5 h-5 text-emerald-400" />,
  'búsqueda':    <Activity className="w-5 h-5 text-purple-400" />,
  'comunicaciones': <SquareActivity className="w-5 h-5 text-cyan-400" />,
};

function iconoBrigada(tipo: string): React.ReactNode {
  const key = Object.keys(TIPO_BRIGADA_ICON).find(k => tipo.toLowerCase().includes(k));
  return key ? TIPO_BRIGADA_ICON[key] : <HardHat className="w-5 h-5 text-gray-400" />;
}

function GridBrigadas({ brigadas }: { brigadas?: BrigadaEmergencia[] | null }) {
  if (!brigadas?.length) {
    return (
      <div className="py-8 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--color-borde)' }}>
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm opacity-40">Sin brigadas registradas</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {brigadas.map((b, i) => (
        <div key={i} className="rounded-xl border p-4 flex gap-3" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.6)' }}>
          <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-white/5">
            {iconoBrigada(b.tipo)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm truncate">{b.tipo}</p>
              {b.certificado && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold shrink-0">
                  <Award className="w-3 h-3" /> Cert.
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>
              Jefe: <span className="font-medium" style={{ color: 'var(--color-texto-principal)' }}>{b.jefe}</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
              {b.miembros} miembro{b.miembros !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Grid de Peligros (JSON) ─────────────────────────────────────────────────

const PELIGRO_COLOR: Record<string, { dot: string; tag: string }> = {
  BAJO:   { dot: 'bg-emerald-400', tag: 'text-emerald-400 bg-emerald-500/10' },
  MEDIO:  { dot: 'bg-amber-400',   tag: 'text-amber-400 bg-amber-500/10'   },
  ALTO:   { dot: 'bg-orange-400',  tag: 'text-orange-400 bg-orange-500/10' },
  CRITICO:{ dot: 'bg-red-400',     tag: 'text-red-400 bg-red-500/10'       },
};

const PELIGRO_TIPO_ICON: Record<string, React.ReactNode> = {
  'eléctrico': <Zap className="w-4 h-4 text-yellow-400" />,
  'electrico': <Zap className="w-4 h-4 text-yellow-400" />,
  'incendio':  <FlameKindling className="w-4 h-4 text-orange-400" />,
  'químico':   <TriangleAlert className="w-4 h-4 text-violet-400" />,
  'quimico':   <TriangleAlert className="w-4 h-4 text-violet-400" />,
  'caída':     <TriangleAlert className="w-4 h-4 text-amber-400" />,
};

function iconoPeligro(tipo: string): React.ReactNode {
  const key = Object.keys(PELIGRO_TIPO_ICON).find(k => tipo.toLowerCase().includes(k));
  return key ? PELIGRO_TIPO_ICON[key] : <AlertTriangle className="w-4 h-4 text-gray-400" />;
}

function GridPeligros({ peligros }: { peligros?: PeligroIdentificado[] | null }) {
  if (!peligros?.length) {
    return (
      <div className="py-8 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--color-borde)' }}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm opacity-40">Sin peligros registrados</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {peligros.map((p, i) => {
        const colors = PELIGRO_COLOR[p.nivel] ?? PELIGRO_COLOR.BAJO;
        return (
          <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.5)' }}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {iconoPeligro(p.tipo)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{p.tipo}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.tag}`}>{p.nivel}</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>
                Zona: <span className="font-medium" style={{ color: 'var(--color-texto-principal)' }}>{p.zona}</span>
                {' · '}Control: {p.control}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Indicador booleano ─────────────────────────────────────────────────────

function Booleano({ valor, labelSi = 'Sí', labelNo = 'No' }: { valor?: boolean; labelSi?: string; labelNo?: string }) {
  if (valor == null) return <span className="text-sm opacity-40">—</span>;
  return valor
    ? <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-semibold"><CheckCircle className="w-4 h-4" />{labelSi}</span>
    : <span className="inline-flex items-center gap-1 text-red-400 text-sm font-semibold"><XCircle className="w-4 h-4" />{labelNo}</span>;
}

// ─── Configuración de pestañas ───────────────────────────────────────────────

type Pestana = 'legal' | 'infraestructura' | 'emergencias' | 'auditorias';

const TABS: { id: Pestana; label: string; icon: React.ReactNode }[] = [
  { id: 'legal',          label: 'Info Legal',                icon: <FileText className="w-4 h-4" />       },
  { id: 'infraestructura',label: 'Infraestructura & Riesgos', icon: <Building2 className="w-4 h-4" />      },
  { id: 'emergencias',    label: 'Respuesta a Emergencias',   icon: <Siren className="w-4 h-4" />          },
  { id: 'auditorias',     label: 'Auditorías',                icon: <ClipboardCheck className="w-4 h-4" /> },
];

const TIPO_INSTALACION_LABEL: Record<string, string> = {
  OFICINA: 'Oficina', PLANTA_INDUSTRIAL: 'Planta Industrial',
  ALMACEN: 'Almacén', LABORATORIO: 'Laboratorio', OBRA: 'Obra',
};

// ══════════════════════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function PaginaDetalleSucursal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana>('legal');

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    sucursalesService.obtenerPorId(id)
      .then(setSucursal)
      .catch(() => navigate('/sucursales'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="skeleton-loader h-10 w-48 rounded-lg" />
        <div className="skeleton-loader h-32 rounded-xl" />
        <div className="skeleton-loader h-64 rounded-xl" />
      </div>
    );
  }

  if (!sucursal) return null;

  const diasDC = diasHasta(sucursal.vencimientoCertificadoDC);
  const certDCAlerta = diasDC !== null && diasDC <= 30;

  return (
    <div className="space-y-6 pb-10">

      {/* ── BACK + TÍTULO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/sucursales')}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-400 self-start"
          style={{ color: 'var(--color-texto-secundario)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sucursales
        </button>
      </div>

      {/* ── CABECERA PRINCIPAL ── */}
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}>

        {/* Alerta DC — banner de alta prioridad */}
        {certDCAlerta && (
          <div className="mb-5">
            <AlertaCertificadoDC fecha={sucursal.vencimientoCertificadoDC} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-5">
          {/* Izquierda: nombre + meta */}
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-500/10 shrink-0">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{sucursal.nombre}</h1>
              {sucursal.direccion && (
                <div className="flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{sucursal.direccion}</span>
                  {sucursal.latitud != null && (
                    <a
                      href={`https://www.google.com/maps?q=${sucursal.latitud},${sucursal.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 transition-colors ml-1"
                      title="Abrir en Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
              {sucursal.tipoInstalacion && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-texto-tenue)' }}>
                  {TIPO_INSTALACION_LABEL[sucursal.tipoInstalacion] ?? sucursal.tipoInstalacion}
                </p>
              )}
            </div>
          </div>

          {/* Derecha: semáforo de riesgo + KPIs */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            <SemaforoRiesgo nivel={sucursal.nivelRiesgo} />
            <div className="flex gap-4 text-center">
              {[
                { label: 'Trabajadores', val: sucursal._count?.trabajadores ?? 0, color: 'text-blue-400' },
                { label: 'Supervisores', val: sucursal._count?.supervisores ?? 0,  color: 'text-purple-400' },
                { label: 'Inspecciones', val: sucursal._count?.inspecciones ?? 0,  color: 'text-emerald-400' },
              ].map(k => (
                <div key={k.label}>
                  <p className={`text-xl font-bold ${k.color}`}>{k.val}</p>
                  <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PESTAÑAS ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPestana(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
              pestana === tab.id
                ? 'text-white'
                : 'hover:bg-white/5'
            }`}
            style={
              pestana === tab.id
                ? { background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }
                : { color: 'var(--color-texto-secundario)' }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 1 — INFO LEGAL
          ══════════════════════════════════════════════════════════════ */}
      {pestana === 'legal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Identificadores legales */}
          <TarjetaSeccion titulo="Identificadores Legales" icon={<FileText className="w-4 h-4" />}>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              <FilaInfo label="Código CIIU"                value={sucursal.codigoCIIU} />
              <FilaInfo label="Código INDECI"              value={sucursal.codigoEstablecimientoINDECI} />
              <FilaInfo label="N° Certificado DC"          value={sucursal.numeroCertificadoDC} />
              <FilaInfo label="Tipo de instalación"        value={sucursal.tipoInstalacion ? TIPO_INSTALACION_LABEL[sucursal.tipoInstalacion] : null} />
            </div>
          </TarjetaSeccion>

          {/* Certificado de Defensa Civil */}
          <TarjetaSeccion titulo="Certificado Defensa Civil (INDECI)" icon={<Shield className="w-4 h-4" />}>
            <div>
              <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                <FilaInfo
                  label="Vencimiento"
                  value={
                    <span className={certDCAlerta ? 'text-red-400 font-bold' : ''}>
                      {formatDate(sucursal.vencimientoCertificadoDC)}
                      {diasDC !== null && diasDC <= 60 && (
                        <span className="ml-2 text-xs opacity-70">({diasDC < 0 ? `Vencido hace ${Math.abs(diasDC)}d` : `${diasDC}d restantes`})</span>
                      )}
                    </span>
                  }
                />
                <FilaInfo label="Próxima revisión" value={formatDate(sucursal.fechaProximaRevisionDC)} />
              </div>
              {/* Barra visual de tiempo restante */}
              {diasDC !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-texto-tenue)' }}>
                    <span>Estado del certificado</span>
                    <span>{diasDC < 0 ? 'Vencido' : `${diasDC} días`}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        diasDC < 0 ? 'bg-red-500 w-full' :
                        diasDC <= 30 ? 'bg-red-500' :
                        diasDC <= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: diasDC < 0 ? '100%' : `${Math.max(4, Math.min(100, 100 - (diasDC / 365) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TarjetaSeccion>

          {/* Nivel de riesgo visual */}
          <TarjetaSeccion titulo="Clasificación de Riesgo" icon={<ShieldAlert className="w-4 h-4" />}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Nivel de riesgo SST</span>
                <SemaforoRiesgo nivel={sucursal.nivelRiesgo} />
              </div>
              {/* Semáforo visual 4 niveles */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] as NivelRiesgo[]).map(n => {
                  const cfg = RIESGO_CFG[n];
                  const activo = sucursal.nivelRiesgo === n;
                  return (
                    <div
                      key={n}
                      className={`rounded-xl p-3 text-center border transition-all ${activo ? `ring-2 ${cfg.ring} ${cfg.bg}` : 'opacity-25 bg-white/5'}`}
                      style={{ borderColor: activo ? 'transparent' : 'var(--color-borde)' }}
                    >
                      <div className={`flex justify-center mb-1 ${cfg.color}`}>{cfg.icon}</div>
                      <p className={`text-xs font-bold ${activo ? cfg.color : ''}`}>{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
              <FilaInfo label="Categoría incendio" value={sucursal.categoriaIncendio ?? null} />
            </div>
          </TarjetaSeccion>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 2 — INFRAESTRUCTURA & RIESGOS
          ══════════════════════════════════════════════════════════════ */}
      {pestana === 'infraestructura' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <TarjetaSeccion titulo="Datos Físicos del Inmueble" icon={<Building2 className="w-4 h-4" />}>
              <div>
                <FilaInfo label="Aforo máximo"         value={sucursal.aforoMaximo ? `${sucursal.aforoMaximo} personas` : null} />
                <FilaInfo label="Área total"            value={sucursal.areaM2 ? `${sucursal.areaM2} m²` : null} />
                <FilaInfo label="Número de pisos"       value={sucursal.numeroPisos} />
                <FilaInfo label="Año construcción"      value={sucursal.anioConstruccion} />
                <FilaInfo label="Zona sísmica (NTE E.030)" value={sucursal.zonaRiesgoSismico ? `Zona ${sucursal.zonaRiesgoSismico}` : null} />
                <FilaInfo label="Categoría incendio"    value={sucursal.categoriaIncendio ?? null} />
              </div>
            </TarjetaSeccion>

            {/* KPIs rápidos de infraestructura */}
            <div className="grid grid-cols-2 gap-3 content-start">
              {[
                { label: 'Extintores',     val: sucursal.cantidadExtintores ?? 0,   color: 'text-orange-400', bg: 'bg-orange-500/10', icon: <FlameKindling className="w-5 h-5" /> },
                { label: 'Botiquines',     val: sucursal.cantidadBotiquines ?? 0,   color: 'text-emerald-400',bg: 'bg-emerald-500/10',icon: <Stethoscope className="w-5 h-5" /> },
                { label: 'Simulacros/año', val: sucursal.cantidadSimulacrosAnio ?? 0,color:'text-blue-400',   bg: 'bg-blue-500/10',   icon: <Activity className="w-5 h-5" /> },
                { label: 'Brigadas',       val: sucursal.brigadasEmergencia?.length ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: <Users className="w-5 h-5" /> },
              ].map(k => (
                <div key={k.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(30,41,59,0.5)' }}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.bg} ${k.color}`}>{k.icon}</div>
                  <div>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{k.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peligros Identificados */}
          <TarjetaSeccion titulo="Peligros Identificados por Zona" icon={<TriangleAlert className="w-4 h-4" />}>
            <GridPeligros peligros={sucursal.peligrosIdentificados} />
          </TarjetaSeccion>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 3 — RESPUESTA A EMERGENCIAS
          ══════════════════════════════════════════════════════════════ */}
      {pestana === 'emergencias' && (
        <div className="space-y-5">

          {/* Botones de llamada — sección de alta prioridad */}
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Siren className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-base text-red-300">Contactos de Emergencia — Llamada Directa</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BotonLlamada
                telefono={sucursal.telefonoEmergenciasSede}
                etiqueta="Emergencias de Sede"
                descripcion="Línea directa de la instalación"
                colorClass="text-red-300"
                bgClass="bg-red-500/15"
                borderClass="border-red-500/40"
              />
              <BotonLlamada
                telefono={sucursal.telefonoCentroMedico}
                etiqueta="Centro Médico"
                descripcion={sucursal.centroMedicoMasCercano ?? 'Servicio médico de emergencia'}
                colorClass="text-emerald-300"
                bgClass="bg-emerald-500/15"
                borderClass="border-emerald-500/40"
              />
              <BotonLlamada
                telefono={sucursal.responsableSSTTelefono}
                etiqueta="Responsable SST"
                descripcion={sucursal.responsableSSTNombre ?? 'Responsable de SST'}
                colorClass="text-blue-300"
                bgClass="bg-blue-500/15"
                borderClass="border-blue-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Estado equipamiento */}
            <TarjetaSeccion titulo="Equipamiento de Emergencias" icon={<HardHat className="w-4 h-4" />}>
              <div>
                <FilaInfo label="Extintores"        value={`${sucursal.cantidadExtintores ?? 0} unidades`} />
                <FilaInfo label="Botiquines"         value={`${sucursal.cantidadBotiquines ?? 0} unidades`} />
                <FilaInfo label="DEA (Desfibrilador)" value={<Booleano valor={sucursal.tieneDesfibriladorDEA} />} />
                {sucursal.tieneDesfibriladorDEA && sucursal.ubicacionDEA && (
                  <FilaInfo label="Ubicación DEA" value={sucursal.ubicacionDEA} />
                )}
                <FilaInfo label="Enfermería"         value={<Booleano valor={sucursal.tieneEnfermeria} />} />
                <FilaInfo label="Centro médico cercano" value={sucursal.centroMedicoMasCercano ?? null} />
              </div>
            </TarjetaSeccion>

            {/* Plan de emergencia */}
            <TarjetaSeccion titulo="Plan de Emergencia y Simulacros" icon={<ClipboardCheck className="w-4 h-4" />}>
              <div>
                <FilaInfo label="Plan vigente"         value={<Booleano valor={sucursal.planEmergenciaVigente} labelSi="Vigente" labelNo="No vigente" />} />
                <FilaInfo label="Vencimiento plan"     value={formatDate(sucursal.fechaVencimientoPlanEmergencia)} />
                <FilaInfo label="Último simulacro"     value={formatDate(sucursal.fechaUltimoSimulacro)} />
                <FilaInfo label="Simulacros al año"    value={sucursal.cantidadSimulacrosAnio ?? null} />
                <FilaInfo label="Responsable SST"      value={sucursal.responsableSSTNombre ?? null} />
                <FilaInfo label="Médico Ocupacional"   value={sucursal.medicoOcupacionalNombre ?? null} />
              </div>
            </TarjetaSeccion>
          </div>

          {/* Brigadas */}
          <TarjetaSeccion titulo="Brigadas de Emergencia" icon={<Users className="w-4 h-4" />}>
            <GridBrigadas brigadas={sucursal.brigadasEmergencia} />
          </TarjetaSeccion>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 4 — AUDITORÍAS
          ══════════════════════════════════════════════════════════════ */}
      {pestana === 'auditorias' && (
        <div className="space-y-5">

          {/* Estado SUNAFIL */}
          <TarjetaSeccion titulo="Trazabilidad SUNAFIL" icon={<ClipboardCheck className="w-4 h-4" />}>
            <div>
              <FilaInfo label="Última inspección SUNAFIL" value={formatDate(sucursal.fechaUltimaInspeccionSUNAFIL)} />
              <FilaInfo
                label="Resultado último control"
                value={<BadgeSUNAFIL resultado={sucursal.resultadoUltimaInspeccion} />}
              />
              <div className="py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-borde)' }}>
                <p className="text-sm mb-2" style={{ color: 'var(--color-texto-secundario)' }}>Observaciones legales activas</p>
                {sucursal.observacionesLegalesActivas ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200">
                    {sucursal.observacionesLegalesActivas}
                  </div>
                ) : (
                  <p className="text-sm opacity-40">Sin observaciones activas</p>
                )}
              </div>
            </div>
          </TarjetaSeccion>

          {/* Revisiones DC */}
          <TarjetaSeccion titulo="Control Certificado DC (INDECI)" icon={<Calendar className="w-4 h-4" />}>
            <div className="space-y-4">
              <div>
                <FilaInfo label="N° Certificado"      value={sucursal.numeroCertificadoDC ?? null} />
                <FilaInfo label="Código INDECI"       value={sucursal.codigoEstablecimientoINDECI ?? null} />
                <FilaInfo label="Fecha vencimiento"   value={
                  <span className={certDCAlerta ? 'text-red-400 font-bold' : ''}>
                    {formatDate(sucursal.vencimientoCertificadoDC)}
                  </span>
                } />
                <FilaInfo label="Próxima revisión"    value={formatDate(sucursal.fechaProximaRevisionDC)} />
              </div>
              {certDCAlerta && (
                <AlertaCertificadoDC fecha={sucursal.vencimientoCertificadoDC} />
              )}
            </div>
          </TarjetaSeccion>

          {/* Timeline resumen */}
          <TarjetaSeccion titulo="Línea de Tiempo Auditorías" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-3">
              {[
                { label: 'Sede creada en sistema',             fecha: sucursal.creadoEn,                        icon: <Building2 className="w-4 h-4 text-blue-400" />, },
                { label: 'Última inspección SUNAFIL',          fecha: sucursal.fechaUltimaInspeccionSUNAFIL,    icon: <ClipboardCheck className="w-4 h-4 text-purple-400" />, },
                { label: 'Último simulacro',                   fecha: sucursal.fechaUltimoSimulacro,            icon: <Activity className="w-4 h-4 text-amber-400" />, },
                { label: 'Vencimiento plan de emergencia',     fecha: sucursal.fechaVencimientoPlanEmergencia,  icon: <FileText className="w-4 h-4 text-orange-400" />, },
                { label: 'Vencimiento certificado DC',         fecha: sucursal.vencimientoCertificadoDC,        icon: <Shield className="w-4 h-4 text-red-400" />, },
                { label: 'Próxima revisión DC',                fecha: sucursal.fechaProximaRevisionDC,          icon: <Calendar className="w-4 h-4 text-emerald-400" />, },
              ].filter(e => e.fecha).map((evento, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shrink-0">
                    {evento.icon}
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>{evento.label}</p>
                    <p className="text-sm font-semibold shrink-0">{formatDate(evento.fecha)}</p>
                  </div>
                </div>
              ))}
              {![sucursal.fechaUltimaInspeccionSUNAFIL, sucursal.fechaUltimoSimulacro, sucursal.fechaVencimientoPlanEmergencia, sucursal.vencimientoCertificadoDC].some(Boolean) && (
                <p className="text-sm text-center opacity-40 py-4">Sin eventos registrados</p>
              )}
            </div>
          </TarjetaSeccion>
        </div>
      )}
    </div>
  );
}
