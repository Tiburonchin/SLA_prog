/**
 * AltaEquipoWizard.tsx — Asistente de 4 pasos para registro de activos HSE
 * Ubicación: /pages/equipos/components/
 * Stack: React 19 · Tailwind v4 · lucide-react
 *
 * Paso 1: Identidad y Ubicación (¿Qué es y dónde está?)
 * Paso 2: Ciclo de Vida y Clasificación (¿Cuánto durará?)
 * Paso 3: Protocolo LOTO — Energías Peligrosas (OSHA 1910.147)
 * Paso 4: EPP Obligatorio — Constructor Visual + Revisión Final
 */
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ChevronRight, ChevronLeft, Check, AlertTriangle, Zap,
  Flame, Wind, Settings, FlaskConical, Lock, Shield, Eye,
  Volume2, Layers, ArrowDown, Plus, Trash2, Building2, MapPin,
  Calendar, Clock, Info, ShieldCheck, Tag, Wrench,
} from 'lucide-react';
import { equiposService, type EppObligatorioItem } from '../../../services/equipos.service';
import { sucursalesService, type Sucursal } from '../../../services/trabajadores.service';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoEquipo =
  | 'MAQUINARIA_PESADA' | 'HERRAMIENTA_PODER' | 'EQUIPO_MEDICION'
  | 'VEHICULO' | 'EQUIPO_PRESION' | 'HERRAMIENTA_MENOR';

interface FormState {
  // Paso 1
  nombre: string;
  numeroSerie: string;
  marca: string;
  modelo: string;
  descripcion: string;
  nfcTagId: string;
  sucursalId: string;
  ubicacionFisica: string;
  // Paso 2
  tipoEquipo: TipoEquipo | '';
  fechaFabricacion: string;
  fechaAdquisicion: string;
  vidaUtilMeses: string;
  proximoMantenimiento: string;
  horasLimiteMantenimiento: string;
  // Paso 3
  requiereLoto: boolean | null;
  puntosBloqueo: string;
  energiasPeligrosas: string[];
  // Paso 4
  eppObligatorio: EppObligatorioItem[];
}

export interface AltaEquipoWizardProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}

// ─── Catálogo: Tipos de equipo ────────────────────────────────────────────────

const TIPOS_EQUIPO: {
  valor: TipoEquipo;
  label: string;
  Icono: typeof Wrench;
  riesgo: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
}[] = [
  { valor: 'MAQUINARIA_PESADA',  label: 'Maquinaria Pesada',    Icono: Settings,    riesgo: 'CRITICO' },
  { valor: 'EQUIPO_PRESION',     label: 'Equipo a Presión',     Icono: Shield,      riesgo: 'CRITICO' },
  { valor: 'HERRAMIENTA_PODER',  label: 'Herramienta de Poder', Icono: Zap,         riesgo: 'ALTO'    },
  { valor: 'VEHICULO',           label: 'Vehículo',             Icono: ShieldCheck, riesgo: 'MEDIO'   },
  { valor: 'EQUIPO_MEDICION',    label: 'Equipo de Medición',   Icono: Eye,         riesgo: 'BAJO'    },
  { valor: 'HERRAMIENTA_MENOR',  label: 'Herramienta Menor',    Icono: Wrench,      riesgo: 'BAJO'    },
];

const RIESGO_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  CRITICO: { bg: 'rgba(220,38,38,0.12)',  text: '#dc2626', border: 'rgba(220,38,38,0.4)'  },
  ALTO:    { bg: 'rgba(234,88,12,0.12)',  text: '#ea580c', border: 'rgba(234,88,12,0.4)'  },
  MEDIO:   { bg: 'rgba(245,158,11,0.12)', text: '#b45309', border: 'rgba(245,158,11,0.4)' },
  BAJO:    { bg: 'rgba(22,163,74,0.12)',  text: '#15803d', border: 'rgba(22,163,74,0.35)' },
};

// ─── Catálogo: Energías Peligrosas (LOTO) ────────────────────────────────────

interface EnergiaItem {
  id: string;
  label: string;
  emoji: string;
  Icono: typeof Zap;
  color: string;
  bg: string;
}

const ENERGIAS_PELIGROSAS: EnergiaItem[] = [
  { id: 'ELECTRICA',     label: 'Eléctrica',     emoji: '⚡', Icono: Zap,          color: '#facc15', bg: 'rgba(250,204,21,0.15)'  },
  { id: 'TERMICA',       label: 'Térmica',       emoji: '🔥', Icono: Flame,        color: '#f97316', bg: 'rgba(249,115,22,0.15)'  },
  { id: 'MECANICA',      label: 'Mecánica',      emoji: '⚙️', Icono: Settings,     color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  { id: 'NEUMATICA',     label: 'Neumática',     emoji: '💨', Icono: Wind,         color: '#a3e635', bg: 'rgba(163,230,53,0.15)'  },
  { id: 'HIDRAULICA',    label: 'Hidráulica',    emoji: '💧', Icono: Wind,         color: '#38bdf8', bg: 'rgba(56,189,248,0.15)'  },
  { id: 'QUIMICA',       label: 'Química',       emoji: '🧪', Icono: FlaskConical, color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  { id: 'GRAVITACIONAL', label: 'Gravitacional', emoji: '⬇️', Icono: ArrowDown,    color: '#fb923c', bg: 'rgba(251,146,60,0.15)'  },
  { id: 'RADIACION',     label: 'Radiación',     emoji: '☢️', Icono: AlertTriangle,color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
];

// ─── Catálogo: EPP ────────────────────────────────────────────────────────────

interface EppCatalogoItem {
  tipo: string;
  label: string;
  emoji: string;
  especificaciones: string[];
}

const EPP_CATALOGO: EppCatalogoItem[] = [
  {
    tipo: 'CASCO', label: 'Casco de Seguridad', emoji: '⛑️',
    especificaciones: ['Clase A (Baja tensión)', 'Clase E (Alta tensión)', 'Clase C (Conductivo)', 'Con barboquejo'],
  },
  {
    tipo: 'LENTES', label: 'Lentes de Seguridad', emoji: '🥽',
    especificaciones: ['Luna Clara', 'Luna Oscura', 'Antiempañante', 'Resistentes a impacto', 'Protección UV'],
  },
  {
    tipo: 'TAPONES', label: 'Protección Auditiva', emoji: '🎧',
    especificaciones: ['Tapones desechables (NRR 29 dB)', 'Orejeras (NRR 33 dB)', 'Tapones reutilizables'],
  },
  {
    tipo: 'GUANTES', label: 'Guantes de Protección', emoji: '🧤',
    especificaciones: ['Nitrilo', 'Cuero', 'Dieléctrico (baja tensión)', 'Dieléctrico (alta tensión)', 'Anticorte', 'Criogénicos'],
  },
  {
    tipo: 'CALZADO', label: 'Calzado de Seguridad', emoji: '🥾',
    especificaciones: ['Punta de acero', 'Dieléctrico', 'Antiestático', 'Punta de composita', 'Bota de goma'],
  },
  {
    tipo: 'ARNES', label: 'Arnés Anticaída', emoji: '🪢',
    especificaciones: ['Cuerpo completo (Clase III)', 'Con línea de vida', 'Con absorvedor de impacto'],
  },
  {
    tipo: 'RESPIRADOR', label: 'Protección Respiratoria', emoji: '😷',
    especificaciones: ['KN95 / N95', 'Respirador media cara + filtros P100', 'Máscara cara completa', 'Respirador polvos y neblinas'],
  },
  {
    tipo: 'TRAJE', label: 'Protección de Cuerpo', emoji: '🦺',
    especificaciones: ['Chaleco fluorescente', 'Traje Tyvek desechable', 'Ropa ignífuga', 'Traje contra ácidos'],
  },
  {
    tipo: 'CARETA', label: 'Careta de Protección', emoji: '🛡️',
    especificaciones: ['Careta facial completa', 'Careta para esmeril', 'Careta de soldadura', 'Pantalla solar'],
  },
];

// ─── Stepper meta ─────────────────────────────────────────────────────────────

const PASOS = [
  { num: 1, titulo: 'Identidad y Ubicación',    subtitulo: '¿Qué es y dónde está?'       },
  { num: 2, titulo: 'Ciclo de Vida',            subtitulo: '¿Cuánto durará?'              },
  { num: 3, titulo: 'Protocolos LOTO',          subtitulo: 'Aislamiento de energía'        },
  { num: 4, titulo: 'EPP Obligatorio',          subtitulo: 'Protección y revisión final'   },
];

// ─── Validación por paso ──────────────────────────────────────────────────────

type ErroresPaso = Partial<Record<string, string>>;

function validarPaso(paso: number, form: FormState): ErroresPaso {
  const e: ErroresPaso = {};
  const esMaquinaCritica =
    form.tipoEquipo === 'MAQUINARIA_PESADA' ||
    form.tipoEquipo === 'EQUIPO_PRESION'    ||
    form.tipoEquipo === 'HERRAMIENTA_PODER';

  switch (paso) {
    case 1:
      if (!form.nombre.trim())      e.nombre      = 'El nombre del equipo es obligatorio.';
      if (!form.numeroSerie.trim()) e.numeroSerie = 'El número de serie es obligatorio para trazabilidad.';
      if (!form.sucursalId)         e.sucursalId  = 'Debe asignar una sucursal al equipo.';
      break;
    case 2:
      if (!form.tipoEquipo) e.tipoEquipo = 'Debe clasificar el tipo de equipo.';
      break;
    case 3:
      if (esMaquinaCritica && form.requiereLoto === null)
        e.requiereLoto = 'Debe indicar si este equipo requiere LOTO (obligatorio en maquinaria crítica).';
      if (form.requiereLoto === true && form.energiasPeligrosas.length === 0)
        e.energiasPeligrosas = 'Si requiere LOTO, seleccione al menos una energía peligrosa.';
      if (form.requiereLoto === true && !form.puntosBloqueo.trim())
        e.puntosBloqueo = 'Debe describir los puntos de bloqueo del equipo.';
      break;
    case 4:
      if (esMaquinaCritica && form.eppObligatorio.length === 0)
        e.epp = 'La maquinaria de riesgo CRÍTICO/ALTO requiere al menos un EPP registrado.';
      break;
  }
  return e;
}

// ─── Sub-componente: InputField ───────────────────────────────────────────────

function InputField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5"
        style={{ color: 'var(--color-texto-secundario)' }}>
        {label} {required && <span style={{ color: 'var(--color-peligro-500)' }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: 'var(--color-peligro-500)' }}>
          <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Sub-componente: EppBuilder (Select + Input + Agregar + Píldoras) ────────

function EppBuilder({ items, onAgregar, onQuitar }: {
  items: EppObligatorioItem[];
  onAgregar: (item: EppObligatorioItem) => void;
  onQuitar: (idx: number) => void;
}) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [especificacion, setEspecificacion] = useState('');

  const catalogoActual = EPP_CATALOGO.find(c => c.tipo === tipoSeleccionado);

  function agregar() {
    if (!tipoSeleccionado) return;
    onAgregar({
      tipo: tipoSeleccionado,
      especificacion: especificacion.trim() || undefined,
      obligatorio: true,
    });
    setTipoSeleccionado('');
    setEspecificacion('');
  }

  const inputStyle = {
    backgroundColor: 'var(--color-fondo-input)',
    borderColor: 'var(--color-borde)',
    color: 'var(--color-texto-principal)',
  };

  return (
    <div className="space-y-4">
      {/* Constructor inline: Select + Especificación + Botón */}
      <div className="p-4 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)' }}>
        <p className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-texto-tenue)' }}>
          Constructor de EPP
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          {/* Select de tipo de EPP */}
          <div className="relative">
            <select
              value={tipoSeleccionado}
              onChange={e => { setTipoSeleccionado(e.target.value); setEspecificacion(''); }}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl text-sm border outline-none appearance-none transition focus:ring-2"
              style={inputStyle}>
              <option value="">— Seleccione EPP —</option>
              {EPP_CATALOGO.map(c => (
                <option key={c.tipo} value={c.tipo}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Input de especificación (dinámico: select si hay catálogo, input libre si no) */}
          {catalogoActual ? (
            <select
              value={especificacion}
              onChange={e => setEspecificacion(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl text-sm border outline-none appearance-none transition focus:ring-2"
              style={inputStyle}>
              <option value="">— Especificación (opcional) —</option>
              {catalogoActual.especificaciones.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          ) : (
            <input
              value={especificacion}
              onChange={e => setEspecificacion(e.target.value)}
              placeholder="Especificación (Ej: Dieléctrico 10kV)"
              className="w-full px-4 py-3 min-h-[48px] rounded-xl text-sm border outline-none transition focus:ring-2"
              style={inputStyle}
            />
          )}

          {/* Botón Agregar */}
          <button
            type="button"
            onClick={agregar}
            disabled={!tipoSeleccionado}
            className="flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ background: tipoSeleccionado
              ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))'
              : 'var(--color-borde)' }}>
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Píldoras de EPP agregados */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => {
            const cat = EPP_CATALOGO.find(c => c.tipo === item.tipo);
            return (
              <div
                key={`${item.tipo}-${idx}`}
                className="inline-flex items-center gap-2 pl-3 pr-1.5 py-2 rounded-full text-sm font-semibold border transition-all animate-fade-in"
                style={{
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  borderColor: 'rgba(59,130,246,0.4)',
                  color: '#60a5fa',
                }}>
                <span className="text-base">{cat?.emoji ?? '🛡️'}</span>
                <span>{cat?.label ?? item.tipo}</span>
                {item.especificacion && (
                  <span className="text-xs opacity-75">— {item.especificacion}</span>
                )}
                <button
                  type="button"
                  onClick={() => onQuitar(idx)}
                  className="ml-1 p-1 rounded-full transition hover:bg-red-500/20"
                  aria-label={`Quitar ${item.tipo}`}>
                  <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL: AltaEquipoWizard
// ═════════════════════════════════════════════════════════════════════════════

const FORM_INICIAL: FormState = {
  nombre: '', numeroSerie: '', marca: '', modelo: '', descripcion: '',
  nfcTagId: '', sucursalId: '', ubicacionFisica: '',
  tipoEquipo: '', fechaFabricacion: '', fechaAdquisicion: '',
  vidaUtilMeses: '', proximoMantenimiento: '', horasLimiteMantenimiento: '',
  requiereLoto: null, puntosBloqueo: '', energiasPeligrosas: [],
  eppObligatorio: [],
};

export default function AltaEquipoWizard({ abierto, onCerrar, onCreado }: AltaEquipoWizardProps) {
  const [pasoActual, setPasoActual] = useState(1);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [errores, setErrores] = useState<ErroresPaso>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  useEffect(() => {
    sucursalesService.obtenerTodas().then(setSucursales).catch(() => {});
  }, []);

  // ESC cierra
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCerrar]);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrores(prev => { const n = { ...prev }; delete n[key as string]; return n; });
  }, []);

  function toggleEnergia(id: string) {
    const actual = form.energiasPeligrosas;
    set('energiasPeligrosas', actual.includes(id) ? actual.filter(e => e !== id) : [...actual, id]);
  }

  function avanzar() {
    const e = validarPaso(pasoActual, form);
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setErrores({});
    if (pasoActual < 4) { setPasoActual(p => p + 1); return; }
    guardar();
  }

  function retroceder() {
    if (pasoActual > 1) { setPasoActual(p => p - 1); setErrores({}); }
  }

  async function guardar() {
    setGuardando(true);
    setErrorGuardar('');
    try {
      const payload = {
        nombre:                   form.nombre.trim(),
        numeroSerie:              form.numeroSerie.trim(),
        marca:                    form.marca.trim() || undefined,
        modelo:                   form.modelo.trim() || undefined,
        descripcion:              form.descripcion.trim() || undefined,
        nfcTagId:                 form.nfcTagId.trim() || undefined,
        sucursalId:               form.sucursalId || undefined,
        ubicacionFisica:          form.ubicacionFisica.trim() || undefined,
        tipoEquipo:               form.tipoEquipo || undefined,
        fechaFabricacion:         form.fechaFabricacion || undefined,
        fechaAdquisicion:         form.fechaAdquisicion || undefined,
        vidaUtilMeses:            form.vidaUtilMeses ? parseInt(form.vidaUtilMeses, 10) : undefined,
        proximoMantenimiento:     form.proximoMantenimiento || undefined,
        horasLimiteMantenimiento: form.horasLimiteMantenimiento ? parseFloat(form.horasLimiteMantenimiento) : undefined,
        requiereLoto:             form.requiereLoto === true,
        puntosBloqueo:            form.puntosBloqueo.trim() || undefined,
        energiasPeligrosas:       form.energiasPeligrosas.length > 0 ? form.energiasPeligrosas : undefined,
        eppObligatorio:           form.eppObligatorio.length > 0 ? form.eppObligatorio : undefined,
      };

      // ── Log del JSON estructurado para verificación ──
      console.log('══════════════════════════════════════════════════');
      console.log('📦 ALTA DE EQUIPO — JSON Estructurado Final:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('══════════════════════════════════════════════════');

      await equiposService.crear(payload as Parameters<typeof equiposService.crear>[0]);
      onCreado();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setErrorGuardar(Array.isArray(msg) ? msg.join(' · ') : (msg || 'Error al guardar el equipo.'));
    } finally {
      setGuardando(false);
    }
  }

  // ─── Derivados ──────────────────────────────────────────────────────────
  const progresoPct = ((pasoActual - 1) / (PASOS.length - 1)) * 100;
  const tipoMeta = TIPOS_EQUIPO.find(t => t.valor === form.tipoEquipo);
  const esMaquinaRiesgo =
    form.tipoEquipo === 'MAQUINARIA_PESADA' ||
    form.tipoEquipo === 'EQUIPO_PRESION'    ||
    form.tipoEquipo === 'HERRAMIENTA_PODER';

  const inputClass = 'w-full px-4 py-3 min-h-[48px] rounded-xl text-sm border outline-none transition focus:ring-2 focus:ring-offset-1';
  const inputStyle = {
    backgroundColor: 'var(--color-fondo-input)',
    borderColor: 'var(--color-borde)',
    color: 'var(--color-texto-principal)',
  };
  const inputStyleError = (field: string) => ({
    ...inputStyle,
    borderColor: errores[field] ? 'var(--color-peligro-500)' : 'var(--color-borde)',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  return createPortal(
    <div
      className="fixed inset-0 z-[70] pointer-events-none"
      style={{ visibility: abierto ? 'visible' : 'hidden' }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-auto"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          opacity: abierto ? 1 : 0,
        }}
        onClick={!guardando ? onCerrar : undefined}
        aria-hidden="true"
      />

      {/* Panel lateral derecho (Drawer) */}
      <div
        role="dialog" aria-modal="true"
        aria-label={`Alta de Equipo — Paso ${pasoActual} de 4: ${PASOS[pasoActual - 1].titulo}`}
        className="absolute top-0 right-0 h-full w-full max-w-xl lg:max-w-2xl flex flex-col shadow-2xl pointer-events-auto"
        style={{
          backgroundColor: 'var(--color-fondo-principal)',
          borderLeft: '1px solid var(--color-borde)',
          transform: abierto ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >

          {/* ─── Header fijo ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 h-16 border-b shrink-0"
            style={{ borderColor: 'var(--color-borde)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: 'var(--color-texto-principal)' }}>
                  Nuevo Equipo
                </h2>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-primary-400)' }}>
                  Paso {pasoActual} de {PASOS.length} — {PASOS[pasoActual - 1].titulo}
                </p>
              </div>
            </div>
            <button type="button" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"
              className="p-2 rounded-lg transition hover:bg-white/10 active:scale-90"
              style={{ color: 'var(--color-texto-tenue)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── Stepper + barra de progreso ─────────────────────────── */}
          <div className="shrink-0 px-6 pt-4 pb-0">

            {/* Stepper — desktop: clickable completed steps, full labels */}
            <div className="flex items-center gap-0 mb-4">
              {PASOS.map((p, i) => {
                const completo = pasoActual > p.num;
                const actual = pasoActual === p.num;
                return (
                  <div key={p.num} className="flex items-center flex-1">
                    <button
                      type="button"
                      disabled={!completo}
                      onClick={() => completo && setPasoActual(p.num)}
                      className={`flex flex-col items-center shrink-0 group ${completo ? 'cursor-pointer' : 'cursor-default'}`}
                      aria-current={actual ? 'step' : undefined}
                      aria-label={`Paso ${p.num}: ${p.titulo}${completo ? ' (completado)' : actual ? ' (actual)' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${completo ? 'group-hover:scale-110 group-hover:shadow-md' : ''}`}
                        style={{
                          backgroundColor: completo ? 'var(--color-primary-500)'
                            : actual ? 'var(--color-primary-500)' + '20' : 'transparent',
                          borderColor: completo || actual ? 'var(--color-primary-500)' : 'var(--color-borde)',
                          color: completo ? '#fff' : actual ? 'var(--color-primary-400)' : 'var(--color-texto-tenue)',
                        }}>
                        {completo ? <Check className="w-4 h-4" /> : p.num}
                      </div>
                      <span className="text-[9px] mt-1 font-semibold tracking-wide text-center leading-tight"
                        style={{ color: actual ? 'var(--color-primary-400)' : completo ? 'var(--color-primary-300)' : 'var(--color-texto-tenue)' }}>
                        {p.titulo.split(' ')[0]}
                      </span>
                    </button>
                    {i < PASOS.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1 rounded-full transition-all"
                        style={{ backgroundColor: pasoActual > p.num ? 'var(--color-primary-500)' : 'var(--color-borde)' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Barra de progreso */}
            <div className="h-1 rounded-full mb-1" style={{ backgroundColor: 'var(--color-borde)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progresoPct}%`, background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400))' }} />
            </div>
          </div>

          {/* ─── Contenido scrollable ─────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ══ PASO 1: Identidad y Ubicación ══════════════════════════ */}
            {pasoActual === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Nombre del Equipo" required error={errores.nombre}>
                    <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                      placeholder="Ej: Compresor Atlas Copco GA55"
                      className={inputClass} style={inputStyleError('nombre')} />
                  </InputField>

                  <InputField label="Número de Serie" required error={errores.numeroSerie}>
                    <input value={form.numeroSerie} onChange={e => set('numeroSerie', e.target.value)}
                      placeholder="Ej: AC-GA55-2024-0087"
                      className={`${inputClass} font-mono`} style={inputStyleError('numeroSerie')} />
                  </InputField>

                  <InputField label="Marca">
                    <input value={form.marca} onChange={e => set('marca', e.target.value)}
                      placeholder="Ej: Atlas Copco" className={inputClass} style={inputStyle} />
                  </InputField>

                  <InputField label="Modelo">
                    <input value={form.modelo} onChange={e => set('modelo', e.target.value)}
                      placeholder="Ej: GA55 VSD+" className={inputClass} style={inputStyle} />
                  </InputField>
                </div>

                <InputField label="Tag NFC (Opcional)">
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--color-texto-tenue)' }} />
                    <input value={form.nfcTagId} onChange={e => set('nfcTagId', e.target.value)}
                      placeholder="ID del tag NFC del equipo"
                      className={`${inputClass} pl-10`} style={inputStyle} />
                  </div>
                </InputField>

                <InputField label="Sucursal / Sede" required error={errores.sucursalId}>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--color-texto-tenue)' }} />
                    <select value={form.sucursalId} onChange={e => set('sucursalId', e.target.value)}
                      className={`${inputClass} pl-10 appearance-none`} style={inputStyleError('sucursalId')}>
                      <option value="">— Seleccione una sucursal —</option>
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </InputField>

                <InputField label="Ubicación Física Específica">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--color-texto-tenue)' }} />
                    <input value={form.ubicacionFisica} onChange={e => set('ubicacionFisica', e.target.value)}
                      placeholder="Ej: Sala de compresores – Planta 2 / Rack C-03"
                      className={`${inputClass} pl-10`} style={inputStyle} />
                  </div>
                </InputField>

                <InputField label="Descripción">
                  <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                    rows={3} placeholder="Función, características, observaciones..."
                    className={`${inputClass} resize-none`} style={inputStyle} />
                </InputField>
              </div>
            )}

            {/* ══ PASO 2: Ciclo de Vida y Clasificación ══════════════════ */}
            {pasoActual === 2 && (
              <div className="space-y-5 animate-fade-in">
                <InputField label="Clasificación del Equipo" required error={errores.tipoEquipo}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {TIPOS_EQUIPO.map(t => {
                      const sel = form.tipoEquipo === t.valor;
                      const r = RIESGO_COLOR[t.riesgo];
                      const Icono = t.Icono;
                      return (
                        <button key={t.valor} type="button"
                          onClick={() => set('tipoEquipo', t.valor)}
                          className="flex flex-col items-center gap-2 p-3 min-h-[80px] rounded-xl border-2 font-semibold text-xs text-center transition-all active:scale-95 hover:shadow-md"
                          style={{
                            backgroundColor: sel ? r.bg : 'transparent',
                            borderColor: sel ? r.border : 'var(--color-borde)',
                            color: sel ? r.text : 'var(--color-texto-tenue)',
                          }}>
                          <Icono className="w-6 h-6" />
                          {t.label}
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${sel ? 'opacity-100' : 'opacity-0'}`}
                            style={{ backgroundColor: r.border + '40', color: r.text }}>
                            {t.riesgo}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </InputField>

                {esMaquinaRiesgo && (
                  <div className="flex items-start gap-3 p-3 rounded-xl text-sm border"
                    style={{ backgroundColor: 'rgba(234,88,12,0.1)', borderColor: 'rgba(234,88,12,0.3)', color: '#ea580c' }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>Equipo de riesgo {tipoMeta?.riesgo}.</strong> Los pasos de LOTO y EPP
                      serán <strong>obligatorios</strong>.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Fecha de Fabricación">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--color-texto-tenue)' }} />
                      <input type="date" value={form.fechaFabricacion}
                        onChange={e => set('fechaFabricacion', e.target.value)}
                        className={`${inputClass} pl-10`} style={inputStyle} />
                    </div>
                  </InputField>

                  <InputField label="Fecha de Adquisición">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--color-texto-tenue)' }} />
                      <input type="date" value={form.fechaAdquisicion}
                        onChange={e => set('fechaAdquisicion', e.target.value)}
                        className={`${inputClass} pl-10`} style={inputStyle} />
                    </div>
                  </InputField>

                  <InputField label="Vida Útil (meses)">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--color-texto-tenue)' }} />
                      <input type="number" min="1" value={form.vidaUtilMeses}
                        onChange={e => set('vidaUtilMeses', e.target.value)}
                        placeholder="Ej: 120" className={`${inputClass} pl-10`} style={inputStyle} />
                    </div>
                  </InputField>

                  <InputField label="Próximo Mantenimiento">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--color-texto-tenue)' }} />
                      <input type="date" value={form.proximoMantenimiento}
                        onChange={e => set('proximoMantenimiento', e.target.value)}
                        className={`${inputClass} pl-10`} style={inputStyle} />
                    </div>
                  </InputField>

                  <InputField label="Horas Límite de Mantenimiento">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--color-texto-tenue)' }} />
                      <input type="number" min="1" step="0.5"
                        value={form.horasLimiteMantenimiento}
                        onChange={e => set('horasLimiteMantenimiento', e.target.value)}
                        placeholder="Ej: 500" className={`${inputClass} pl-10`} style={inputStyle} />
                    </div>
                  </InputField>
                </div>
              </div>
            )}

            {/* ══ PASO 3: Protocolo LOTO — Tarjetas de Energías ══════════ */}
            {pasoActual === 3 && (
              <div className="space-y-5 animate-fade-in">
                {/* Banner normativo */}
                <div className="flex items-start gap-3 p-3 rounded-xl text-xs border"
                  style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>OSHA 1910.147 / DS 024-2016-EM.</strong> El procedimiento de Bloqueo y
                    Etiquetado (LOTO) debe aplicarse en equipos con energías peligrosas antes de
                    cualquier intervención de mantenimiento.
                  </span>
                </div>

                {/* Toggle Sí/No */}
                <div>
                  <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-texto-principal)' }}>
                    ¿Este equipo requiere procedimiento LOTO?
                    {esMaquinaRiesgo && <span style={{ color: 'var(--color-peligro-500)' }}> *</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { valor: true,  label: 'SÍ, Requiere LOTO', Icono: Lock,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.4)'  },
                      { valor: false, label: 'NO Requiere LOTO',  Icono: Shield, color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.35)' },
                    ] as const).map(opt => {
                      const sel = form.requiereLoto === opt.valor;
                      const Icono = opt.Icono;
                      return (
                        <button key={String(opt.valor)} type="button"
                          onClick={() => set('requiereLoto', opt.valor)}
                          className="flex flex-col items-center gap-2 p-4 min-h-[90px] rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 hover:shadow-md"
                          style={{
                            backgroundColor: sel ? opt.bg : 'transparent',
                            borderColor: sel ? opt.border : 'var(--color-borde)',
                            color: sel ? opt.color : 'var(--color-texto-tenue)',
                          }}>
                          <Icono className="w-8 h-8" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {errores.requiereLoto && (
                    <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--color-peligro-500)' }}>
                      <AlertTriangle className="w-3 h-3" /> {errores.requiereLoto}
                    </p>
                  )}
                </div>

                {/* Panel LOTO expandido */}
                {form.requiereLoto === true && (
                  <div className="space-y-5 animate-fade-in">
                    <InputField label="Puntos de Bloqueo" required error={errores.puntosBloqueo}>
                      <textarea value={form.puntosBloqueo}
                        onChange={e => set('puntosBloqueo', e.target.value)}
                        rows={3}
                        placeholder="Ej: Disyuntor Panel A (CB-01)&#10;Válvula hidráulica de descarga (VD-03)&#10;Válvula de vapor principal 150 bar"
                        className={`${inputClass} resize-none`}
                        style={inputStyleError('puntosBloqueo')} />
                    </InputField>

                    {/* ── Grid de tarjetas seleccionables de energías ── */}
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-texto-principal)' }}>
                        Energías Peligrosas Presentes <span style={{ color: 'var(--color-peligro-500)' }}>*</span>
                      </p>
                      <p className="text-xs mb-3" style={{ color: 'var(--color-texto-tenue)' }}>
                        Toque cada tarjeta para seleccionar/deseleccionar las fuentes de energía del equipo.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {ENERGIAS_PELIGROSAS.map(energia => {
                          const activa = form.energiasPeligrosas.includes(energia.id);
                          const Icono = energia.Icono;
                          return (
                            <button key={energia.id} type="button"
                              onClick={() => toggleEnergia(energia.id)}
                              className={`
                                relative flex flex-col items-center justify-center gap-2
                                p-4 min-h-[100px] rounded-2xl border-2 text-sm font-bold
                                transition-all active:scale-95 hover:shadow-md
                                ${activa ? 'shadow-lg' : ''}
                              `}
                              style={{
                                backgroundColor: activa ? energia.bg : 'transparent',
                                borderColor: activa ? energia.color : 'var(--color-borde)',
                                color: activa ? energia.color : 'var(--color-texto-tenue)',
                              }}>
                              {/* Checkmark */}
                              {activa && (
                                <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: energia.color }}>
                                  <Check className="w-3 h-3 text-white" />
                                </span>
                              )}
                              <span className="text-2xl">{energia.emoji}</span>
                              <Icono className="w-5 h-5" />
                              <span className="text-xs">{energia.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {errores.energiasPeligrosas && (
                        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--color-peligro-500)' }}>
                          <AlertTriangle className="w-3 h-3" /> {errores.energiasPeligrosas}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {form.requiereLoto === false && (
                  <div className="flex items-center gap-3 p-4 rounded-xl text-sm border"
                    style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#4ade80' }}>
                    <Shield className="w-5 h-5 shrink-0" />
                    <span>Este equipo no requiere aislamiento LOTO. Puede continuar al siguiente paso.</span>
                  </div>
                )}
              </div>
            )}

            {/* ══ PASO 4: EPP Obligatorio + Revisión Final ═══════════════ */}
            {pasoActual === 4 && (
              <div className="space-y-5 animate-fade-in">
                {esMaquinaRiesgo && (
                  <div className="flex items-start gap-3 p-3 rounded-xl text-xs border"
                    style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Maquinaria de riesgo <strong>{tipoMeta?.riesgo}</strong>: registre al menos un
                      EPP obligatorio para operar este equipo.
                    </span>
                  </div>
                )}

                {/* Constructor visual EPP (Select + Input + Agregar + Píldoras) */}
                <EppBuilder
                  items={form.eppObligatorio}
                  onAgregar={(item) => set('eppObligatorio', [...form.eppObligatorio, item])}
                  onQuitar={(idx) => set('eppObligatorio', form.eppObligatorio.filter((_, i) => i !== idx))}
                />
                {errores.epp && (
                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-peligro-500)' }}>
                    <AlertTriangle className="w-3 h-3" /> {errores.epp}
                  </p>
                )}

                {/* Resumen del activo */}
                <div className="p-4 rounded-xl border space-y-2.5"
                  style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)' }}>
                  <p className="text-xs font-black uppercase tracking-wider"
                    style={{ color: 'var(--color-texto-tenue)' }}>
                    Resumen del Activo
                  </p>
                  {[
                    { icon: <Tag className="w-3.5 h-3.5" />,       label: 'Nombre',   val: form.nombre || '—' },
                    { icon: <Wrench className="w-3.5 h-3.5" />,    label: 'N° Serie',  val: form.numeroSerie || '—' },
                    { icon: <Building2 className="w-3.5 h-3.5" />, label: 'Sucursal', val: sucursales.find(s => s.id === form.sucursalId)?.nombre || '—' },
                    { icon: <Settings className="w-3.5 h-3.5" />,  label: 'Tipo',     val: tipoMeta?.label || '—' },
                    { icon: <Lock className="w-3.5 h-3.5" />,      label: 'LOTO',     val: form.requiereLoto === true ? `Sí (${form.energiasPeligrosas.length} energías)` : form.requiereLoto === false ? 'No requerido' : 'Sin especificar' },
                    { icon: <Shield className="w-3.5 h-3.5" />,    label: 'EPP',      val: form.eppObligatorio.length > 0 ? form.eppObligatorio.map(e => `${EPP_CATALOGO.find(c => c.tipo === e.tipo)?.emoji ?? '🛡️'} ${e.tipo}`).join(', ') : 'Sin registrar' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-center gap-1.5 font-medium shrink-0"
                        style={{ color: 'var(--color-texto-tenue)' }}>
                        {row.icon} {row.label}
                      </span>
                      <span className="font-semibold text-right truncate max-w-[60%]"
                        style={{ color: 'var(--color-texto-principal)' }}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>

                {errorGuardar && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-sm border"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {errorGuardar}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Footer: Navegación ──────────────────────────────────── */}
          <div className="shrink-0 px-6 py-4 border-t flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--color-borde)' }}>
            {pasoActual > 1 ? (
              <button type="button" onClick={retroceder} disabled={guardando}
                className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-medium border transition hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}>
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            ) : (
              <button type="button" onClick={onCerrar}
                className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-medium border transition hover:bg-white/5"
                style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}

            <button type="button" onClick={avanzar} disabled={guardando}
              className="flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] hover:shadow-xl hover:brightness-110 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
              {guardando ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Guardando...
                </>
              ) : pasoActual === 4 ? (
                <><Check className="w-4 h-4" /> Guardar Activo</>
              ) : (
                <>Siguiente <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
      </div>
    </div>,
    document.body,
  );
}
