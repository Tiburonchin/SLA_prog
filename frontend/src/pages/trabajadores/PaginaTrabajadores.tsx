import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Heart, MoreVertical, X, Check, MapPin, Download,
  Package, GraduationCap, AlertTriangle, ClipboardCheck,
  Building2, Eye, Edit2, Trash2, Camera,
} from 'lucide-react';
import { trabajadoresService, sucursalesService } from '../../services/trabajadores.service';
import type { Trabajador, Sucursal, CrearTrabajadorData, PaginacionRespuesta } from '../../services/trabajadores.service';

/* ─── Constantes ─── */
const ESTADO_SALUD_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  APTO: { label: 'Apto', color: 'var(--color-exito-500)', bg: 'rgba(34, 197, 94, 0.15)' },
  NO_APTO: { label: 'No Apto', color: 'var(--color-peligro-500)', bg: 'rgba(239, 68, 68, 0.15)' },
  APTO_CON_RESTRICCIONES: { label: 'Restricciones', color: 'var(--color-advertencia-500)', bg: 'rgba(245, 158, 11, 0.15)' },
};

const TIPOS_SANGRE = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/* ─── Badge ─── */
function Badge({ valor, color = 'blue' }: { valor: number; color?: string }) {
  const c: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-xs font-bold ${c[color] || c.blue}`}>
      {valor}
    </span>
  );
}

/* ─── Menú contextual ─── */
function MenuAcciones({ onVer, onDesactivar }: { onVer: () => void; onDesactivar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function cerrar(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false); }
    if (abierto) document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto(!abierto)} className="p-3 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors focus:ring-2 focus:ring-blue-500/50 outline-none" style={{ color: 'var(--color-texto-secundario)' }} aria-label="Acciones">
        <MoreVertical className="w-5 h-5 mx-auto" />
      </button>
      {abierto && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-2xl z-50 py-1" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <button onClick={() => { onVer(); setAbierto(false); }} className="w-full flex items-center gap-2.5 px-4 min-h-[44px] hover:bg-white/5 transition-colors text-left text-sm font-medium focus:ring-2 focus:ring-inset focus:ring-blue-500/50 outline-none" style={{ color: 'var(--color-texto-principal)' }}>
            <Eye className="w-4 h-4 text-blue-400" /> Ver Perfil 360°
          </button>
          <button onClick={() => { onDesactivar(); setAbierto(false); }} className="w-full flex items-center gap-2.5 px-4 min-h-[44px] hover:bg-red-500/10 transition-colors text-left text-sm font-medium text-red-400 focus:ring-2 focus:ring-inset focus:ring-red-500/50 outline-none">
            <Trash2 className="w-4 h-4" /> Desactivar
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Exportar CSV ─── */
function exportarCSV(trabajadores: Trabajador[]) {
  const h = 'Nombre,DNI,Cargo,Sucursal,Salud,EPP,Capacitaciones,Amonestaciones';
  const rows = trabajadores.map(t =>
    `"${t.nombreCompleto}","${t.dni}","${t.cargo}","${t.sucursal?.nombre || ''}","${t.estadoSalud}",${t._count?.entregasEpp || 0},${t._count?.capacitaciones || 0},${t._count?.amonestaciones || 0}`
  );
  const csv = [h, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trabajadores_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Helper para comprimir imagen ─── */
function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/* ─── Drawer para crear trabajador ─── */
function DrawerTrabajador({
  abierto, sucursales, onCerrar, onCreado,
}: {
  abierto: boolean;
  sucursales: Sucursal[];
  onCerrar: () => void;
  onCreado: () => void;
}) {
  const [form, setForm] = useState<CrearTrabajadorData>({
    dni: '', nombreCompleto: '', cargo: '', sucursalId: '', fotoBase64: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ dni: '', nombreCompleto: '', cargo: '', sucursalId: '', fotoBase64: '' });
    setError('');
  };

  const manejarCambioFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await comprimirImagen(file);
      setForm(prev => ({ ...prev, fotoBase64: compressedBase64 }));
    } catch (err) {
      setError('Error al procesar la imagen');
    }
  };

  const manejarSubmit = async () => {
    if (!form.dni.trim() || !form.nombreCompleto.trim() || !form.cargo.trim() || !form.sucursalId) {
      setError('Complete todos los campos obligatorios');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      await trabajadoresService.crear({
        ...form,
        tipoSangre: form.tipoSangre || undefined,
        telefonoEmergencia: form.telefonoEmergencia || undefined,
        contactoEmergencia: form.contactoEmergencia || undefined,
      });
      resetForm();
      onCerrar();
      onCreado();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear trabajador');
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] pointer-events-none" style={{ visibility: abierto ? 'visible' : 'hidden' }}>
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-auto"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', opacity: abierto ? 1 : 0 }}
        onClick={!guardando ? () => { resetForm(); onCerrar(); } : undefined}
      />
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
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="font-bold text-lg">Nuevo Trabajador</h2>
          </div>
          <button onClick={() => { resetForm(); onCerrar(); }} disabled={guardando} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>{error}</div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center pt-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={manejarCambioFoto} className="hidden" />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-blue-500/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed group transition-all hover:border-blue-500/50"
              style={{ borderColor: form.fotoBase64 ? 'transparent' : 'rgba(59,130,246,0.3)' }}
            >
              {form.fotoBase64 ? (
                <>
                  <img src={form.fotoBase64} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-blue-400 mb-1" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase">Subir Foto</span>
                </>
              )}
            </div>
          </div>

          {/* Datos Laborales */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-texto-tenue)' }}>Datos Laborales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>DNI / Identificación <span className="text-red-500">*</span></label>
                <input type="text" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej. INE-12345678" autoFocus={abierto} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Nombre Completo <span className="text-red-500">*</span></label>
                <input type="text" value={form.nombreCompleto} onChange={e => setForm({ ...form, nombreCompleto: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50" style={{ borderColor: 'var(--color-borde)' }} placeholder="Nombre y Apellidos" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Cargo / Puesto <span className="text-red-500">*</span></label>
                <input type="text" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej. Operador de Montacargas" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Sucursal <span className="text-red-500">*</span></label>
                <select value={form.sucursalId} onChange={e => setForm({ ...form, sucursalId: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none" style={{ borderColor: 'var(--color-borde)' }}>
                  <option value="">Seleccionar sucursal...</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Info Médica */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-texto-tenue)' }}>Información Médica <span className="font-normal lowercase">(opcional)</span></h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Tipo de Sangre</label>
                <select value={form.tipoSangre || ''} onChange={e => setForm({ ...form, tipoSangre: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none" style={{ borderColor: 'var(--color-borde)' }}>
                  <option value="">Seleccionar...</option>
                  {TIPOS_SANGRE.filter(Boolean).map(ts => <option key={ts} value={ts}>{ts}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Teléfono de Emergencia</label>
                <input type="tel" value={form.telefonoEmergencia || ''} onChange={e => setForm({ ...form, telefonoEmergencia: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej. 555-123-4567" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Contacto de Emergencia</label>
                <input type="text" value={form.contactoEmergencia || ''} onChange={e => setForm({ ...form, contactoEmergencia: e.target.value })} className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej. María López (Esposa)" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <button type="button" onClick={() => { resetForm(); onCerrar(); }} disabled={guardando} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm border transition-colors hover:bg-white/5 disabled:opacity-50" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
            Cancelar
          </button>
          <button type="button" onClick={manejarSubmit} disabled={guardando} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
            <Check className="w-4 h-4" />
            {guardando ? 'Procesando...' : 'Crear Trabajador'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════════════════════ */

export default function PaginaTrabajadores() {
  const navigate = useNavigate();
  const [paginacion, setPaginacion] = useState<PaginacionRespuesta<Trabajador>>({ datos: [], total: 0, pagina: 1, limite: 20, totalPaginas: 1 });
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [filtroSalud, setFiltroSalud] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  const cargarDatos = async (p = pagina) => {
    setCargando(true);
    try {
      const [trabs, sucs] = await Promise.all([
        trabajadoresService.obtenerTodos(busqueda || undefined, filtroSucursal || undefined, p, 20),
        sucursalesService.obtenerTodas(),
      ]);
      setPaginacion(trabs);
      setSucursales(sucs);
    } catch (err) {
      console.error('Error cargando trabajadores:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { setPagina(1); cargarDatos(1); }, [filtroSucursal, filtroSalud]);
  useEffect(() => { const t = setTimeout(() => { setPagina(1); cargarDatos(1); }, 400); return () => clearTimeout(t); }, [busqueda]);
  useEffect(() => { cargarDatos(pagina); }, [pagina]);

  // Filter by health status on client since backend doesn't support it
  const trabajadoresFiltrados = filtroSalud
    ? paginacion.datos.filter(t => t.estadoSalud === filtroSalud)
    : paginacion.datos;

  // KPIs
  const totalVisible = paginacion.total;
  const sinEpp = paginacion.datos.filter(t => (t._count?.entregasEpp || 0) === 0).length;
  const totalCaps = paginacion.datos.reduce((a, t) => a + (t._count?.capacitaciones || 0), 0);
  const totalAmon = paginacion.datos.reduce((a, t) => a + (t._count?.amonestaciones || 0), 0);

  const manejarDesactivar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Desactivar al trabajador "${nombre}"?`)) return;
    try {
      await trabajadoresService.desactivar(id);
      cargarDatos();
    } catch { alert('Error al desactivar'); }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Trabajadores</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400">
              {paginacion.total} activos
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
            Gestiona la fuerza laboral, su equipamiento de protección, capacitaciones y expediente de seguridad.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <button onClick={() => exportarCSV(trabajadoresFiltrados)} className="flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-lg font-medium text-sm border transition-colors hover:bg-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}>
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => setDrawerAbierto(true)} className="flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-lg font-bold text-sm text-white transition-transform active:scale-95 focus:ring-2 focus:ring-blue-400/50 outline-none shadow-lg hover:shadow-blue-500/25" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))' }}>
            <Plus className="w-5 h-5" /> Nuevo Trabajador
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-8 py-3 bg-white/5 px-6 rounded-2xl" style={{ border: '1px solid var(--color-borde)' }}>
        {[
          { label: 'Total Trabajadores', value: totalVisible, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Sin EPP Registrado', value: sinEpp, icon: Package, color: sinEpp > 0 ? 'text-red-400' : 'text-emerald-400', bg: sinEpp > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
          { label: 'Capacitaciones', value: totalCaps, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Amonestaciones', value: totalAmon, icon: AlertTriangle, color: totalAmon > 0 ? 'text-amber-400' : 'text-emerald-400', bg: totalAmon > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10' },
        ].map((kpi, idx) => (
          <div key={kpi.label} className={`flex items-center gap-4 flex-1 ${idx !== 0 ? 'lg:border-l lg:pl-8' : ''}`} style={{ borderColor: 'var(--color-borde)' }}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-none tracking-tight">{kpi.value}</p>
              <p className="text-xs mt-1.5 font-medium tracking-wide uppercase" style={{ color: 'var(--color-texto-tenue)' }}>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTROS (TOOLBAR) ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-transparent pb-2 mt-4 lg:mt-8">
        <div className="relative flex-1 w-full lg:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-blue-400" style={{ color: 'var(--color-texto-tenue)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, DNI o cargo..." className="w-full pl-11 pr-4 min-h-[44px] rounded-xl bg-white/5 border border-transparent hover:bg-white/10 focus:bg-transparent focus:border-blue-500/50 outline-none transition-all text-sm" />
        </div>
        <div className="relative w-full lg:w-auto min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-texto-tenue)' }} />
          <select value={filtroSucursal} onChange={e => setFiltroSucursal(e.target.value)} className="w-full pl-10 pr-8 min-h-[44px] rounded-xl bg-white/5 border border-transparent hover:bg-white/10 focus:border-blue-500/50 outline-none appearance-none text-sm cursor-pointer transition-all" style={{ color: 'var(--color-texto-principal)' }}>
            <option value="">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="relative w-full lg:w-auto min-w-[200px]">
          <Heart className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-texto-tenue)' }} />
          <select value={filtroSalud} onChange={e => setFiltroSalud(e.target.value)} className="w-full pl-10 pr-8 min-h-[44px] rounded-xl bg-white/5 border border-transparent hover:bg-white/10 focus:border-blue-500/50 outline-none appearance-none text-sm cursor-pointer transition-all" style={{ color: 'var(--color-texto-principal)' }}>
            <option value="">Todos los estados vitales</option>
            <option value="APTO">Apto para laborar</option>
            <option value="NO_APTO">No Apto</option>
            <option value="APTO_CON_RESTRICCIONES">Apto con Restricciones</option>
          </select>
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="overflow-x-auto">
        {cargando ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-loader h-14 rounded-lg" />)}
          </div>
        ) : trabajadoresFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10"><Users className="w-8 h-8 text-blue-400" /></div>
            </div>
            <h3 className="text-lg font-bold mb-2">No se encontraron trabajadores</h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-texto-secundario)' }}>
              {busqueda ? 'Intenta con otros términos de búsqueda' : 'Registra tu primer trabajador para comenzar'}
            </p>
            {!busqueda && (
              <button onClick={() => setDrawerAbierto(true)} className="px-6 min-h-[44px] text-white rounded-lg font-bold text-sm transition-transform active:scale-95 shadow-lg focus:ring-2 focus:ring-blue-400 outline-none" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))' }}>
                Crear primer trabajador
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>
                  <th className="px-5 py-3.5 font-semibold">Trabajador</th>
                  <th className="px-5 py-3.5 font-semibold">Cargo</th>
                  <th className="px-5 py-3.5 font-semibold">Sucursal</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Salud</th>
                  <th className="px-5 py-3.5 font-semibold text-center">EPP</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Capacitaciones</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Amonestaciones</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {trabajadoresFiltrados.map(t => {
                  const badge = ESTADO_SALUD_BADGE[t.estadoSalud];
                  return (
                    <tr
                      key={t.id}
                      className="border-b transition-colors hover:bg-white/5 focus-within:bg-white/5 cursor-pointer group"
                      style={{ borderColor: 'var(--color-borde)' }}
                      onClick={() => navigate(`/trabajadores/${t.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {t.fotoUrl ? (
                            <img src={t.fotoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="notranslate w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--color-primary-500)', color: 'white', opacity: 0.85 }} aria-hidden="true">
                              {t.nombreCompleto.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">{t.nombreCompleto}</span>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>DNI: {t.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{t.cargo}</td>
                      <td className="px-5 py-4" style={{ color: 'var(--color-texto-secundario)' }}>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 opacity-50 shrink-0" />
                          <span className="truncate max-w-[140px]">{t.sucursal?.nombre || '—'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                          <Heart className="w-3 h-3 shrink-0" /> {badge?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge valor={t._count?.entregasEpp || 0} color={(t._count?.entregasEpp || 0) === 0 ? 'red' : 'blue'} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge valor={t._count?.capacitaciones || 0} color="green" />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge valor={t._count?.amonestaciones || 0} color={(t._count?.amonestaciones || 0) > 0 ? 'red' : 'green'} />
                      </td>
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <MenuAcciones
                          onVer={() => navigate(`/trabajadores/${t.id}`)}
                          onDesactivar={() => manejarDesactivar(t.id, t.nombreCompleto)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!cargando && paginacion.totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t text-sm" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }}>
            <span>Mostrando {((pagina - 1) * paginacion.limite) + 1}–{Math.min(pagina * paginacion.limite, paginacion.total)} de {paginacion.total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(paginacion.totalPaginas, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPagina(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagina === p ? 'text-white shadow' : 'hover:bg-white/10'}`} style={pagina === p ? { background: 'var(--color-primary-500)' } : {}}>
                    {p}
                  </button>
                );
              })}
              {paginacion.totalPaginas > 5 && <span className="px-1">…</span>}
              <button onClick={() => setPagina(p => Math.min(paginacion.totalPaginas, p + 1))} disabled={pagina === paginacion.totalPaginas} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DRAWER ── */}
      <DrawerTrabajador
        abierto={drawerAbierto}
        sucursales={sucursales}
        onCerrar={() => setDrawerAbierto(false)}
        onCreado={() => cargarDatos()}
      />
    </div>
  );
}
