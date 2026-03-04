import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Filter, X, ChevronRight } from 'lucide-react';
import { amonestacionesService, type Amonestacion, type SeveridadFalta } from '../../services/amonestaciones.service';
import { trabajadoresService, sucursalesService, type Trabajador, type Sucursal } from '../../services/trabajadores.service';
import { supervisoresService } from '../../services/supervisores.service';

const SEVERIDAD_CONFIG: Record<SeveridadFalta, { label: string; color: string; bg: string }> = {
  LEVE: { label: 'Leve', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  GRAVE: { label: 'Grave', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  CRITICA: { label: 'Crítica', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const MOTIVOS_ESTANDAR = [
  'No uso de EPP',
  'Acto inseguro',
  'Incumplimiento de procedimiento',
  'Daño a equipos o instalaciones',
  'Imprudencia temeraria',
  'Incumplimiento de orden directa',
  'Otro',
];

export default function PaginaAmonestaciones() {
  const [amonestaciones, setAmonestaciones] = useState<Amonestacion[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [form, setForm] = useState({
    trabajadorId: '',
    supervisorId: '',
    sucursalId: '',
    motivo: '',
    motivoCustom: '',
    severidad: 'LEVE' as SeveridadFalta,
    descripcion: '',
    testimonios: '',
    fechaEvento: new Date().toISOString().split('T')[0],
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const [amon, trabs, sucs, sups] = await Promise.all([
        amonestacionesService.obtenerTodas(filtroSeveridad ? { severidad: filtroSeveridad } : {}),
        trabajadoresService.obtenerTodos(),
        sucursalesService.obtenerTodas(),
        supervisoresService.obtenerTodos(),
      ]);
      setAmonestaciones(amon.datos);
      setTrabajadores(trabs.datos);
      setSucursales(sucs);
      setSupervisores(sups);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [filtroSeveridad]);

  const amonestacionesFiltradas = amonestaciones.filter(a => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      a.trabajador?.nombreCompleto.toLowerCase().includes(q) ||
      a.motivo.toLowerCase().includes(q) ||
      a.sucursal?.nombre.toLowerCase().includes(q)
    );
  });

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trabajadorId || !form.supervisorId || !form.sucursalId) {
      setErrorForm('Trabajador, Supervisor y Sucursal son obligatorios');
      return;
    }
    const motivoFinal = form.motivo === 'Otro' ? form.motivoCustom : form.motivo;
    if (!motivoFinal) { setErrorForm('Ingresa el motivo'); return; }

    setGuardando(true);
    setErrorForm('');
    try {
      await amonestacionesService.crear({
        trabajadorId: form.trabajadorId,
        supervisorId: form.supervisorId,
        sucursalId: form.sucursalId,
        motivo: motivoFinal,
        severidad: form.severidad,
        descripcion: form.descripcion,
        testimonios: form.testimonios || undefined,
        fechaEvento: form.fechaEvento,
      });
      setMostrarModal(false);
      setForm({
        trabajadorId: '', supervisorId: '', sucursalId: '',
        motivo: '', motivoCustom: '',
        severidad: 'LEVE', descripcion: '', testimonios: '',
        fechaEvento: new Date().toISOString().split('T')[0],
      });
      cargar();
    } catch (err: any) {
      setErrorForm(err.response?.data?.message || 'Error al registrar');
    } finally { setGuardando(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-7 h-7" style={{ color: 'var(--color-advertencia-500)' }} />
            Amonestaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && amonestaciones.length === 0 ? 'Cargando...' : `${amonestaciones.length} registros`}
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--color-advertencia-500), #d97706)' }}
        >
          <Plus className="w-4 h-4" /> Nueva Amonestación
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por trabajador, motivo, sucursal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <select
            value={filtroSeveridad}
            onChange={e => setFiltroSeveridad(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg text-sm border outline-none appearance-none"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          >
            <option value="">Todas las severidades</option>
            <option value="LEVE">Leve</option>
            <option value="GRAVE">Grave</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>
      </div>

      {/* Tabla / Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-advertencia-500)', borderTopColor: 'transparent' }} />
        </div>
      ) : amonestacionesFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron amonestaciones</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-borde)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-fondo-card)' }}>
                {['Trabajador', 'Motivo', 'Severidad', 'Sucursal', 'Fecha', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {amonestacionesFiltradas.map((a, i) => {
                const sev = SEVERIDAD_CONFIG[a.severidad];
                return (
                  <tr key={a.id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--color-borde)', animationDelay: `${i * 30}ms` }}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.trabajador?.nombreCompleto}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{a.trabajador?.dni} · {a.trabajador?.cargo}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{a.motivo}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: sev.bg, color: sev.color }}>
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{a.sucursal?.nombre}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                      {new Date(a.fechaEvento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
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
      )}

      {/* Modal Alta Rápida */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
            {/* Header modal */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-borde)' }}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-advertencia-500)' }} />
                Registrar Amonestación
              </h3>
              <button onClick={() => setMostrarModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>

            <form id="form-amon" onSubmit={manejarGuardar} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {errorForm && (
                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>{errorForm}</div>
              )}

              {/* Trabajador */}
              <div>
                <label className="block text-sm font-medium mb-1">Trabajador <span className="text-red-500">*</span></label>
                <select required value={form.trabajadorId} onChange={e => setForm({ ...form, trabajadorId: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                  <option value="">Seleccionar...</option>
                  {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombreCompleto} — {t.dni}</option>)}
                </select>
              </div>

              {/* Supervisor y Sucursal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supervisor <span className="text-red-500">*</span></label>
                  <select required value={form.supervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="">Seleccionar...</option>
                    {supervisores.map(s => <option key={s.id} value={s.id}>{s.usuario?.nombreCompleto || s.nombreCompleto}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sucursal <span className="text-red-500">*</span></label>
                  <select required value={form.sucursalId} onChange={e => setForm({ ...form, sucursalId: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium mb-1">Motivo <span className="text-red-500">*</span></label>
                <select value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                  <option value="">Seleccionar motivo...</option>
                  {MOTIVOS_ESTANDAR.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {form.motivo === 'Otro' && (
                  <input value={form.motivoCustom} onChange={e => setForm({ ...form, motivoCustom: e.target.value })} placeholder="Especificar motivo..." className="mt-2 w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }} />
                )}
              </div>

              {/* Severidad y Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Severidad <span className="text-red-500">*</span></label>
                  <select value={form.severidad} onChange={e => setForm({ ...form, severidad: e.target.value as SeveridadFalta })} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="LEVE">⚠ Leve</option>
                    <option value="GRAVE">🔶 Grave</option>
                    <option value="CRITICA">🔴 Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha del Evento <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.fechaEvento} onChange={e => setForm({ ...form, fechaEvento: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }} />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1">Relatoría <span className="text-red-500">*</span></label>
                <textarea required rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describir los hechos con detalle..." className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none resize-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>

              {/* Testimonios */}
              <div>
                <label className="block text-sm font-medium mb-1">Testimonios (opcional)</label>
                <textarea rows={2} value={form.testimonios} onChange={e => setForm({ ...form, testimonios: e.target.value })} placeholder="Testimonios de testigos..." className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none resize-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
            </form>

            <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-borde)' }}>
              <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition">Cancelar</button>
              <button form="form-amon" type="submit" disabled={guardando} className="px-5 py-2 text-sm font-bold text-white rounded-lg transition disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--color-advertencia-500), #d97706)' }}>
                {guardando ? 'Guardando...' : 'Registrar Amonestación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
