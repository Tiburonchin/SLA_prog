import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Filter, X, ChevronRight, WifiOff, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { amonestacionesService, type Amonestacion, type SeveridadFalta } from '../../services/amonestaciones.service';
import { trabajadoresService, sucursalesService, type Trabajador, type Sucursal } from '../../services/trabajadores.service';
import { supervisoresService } from '../../services/supervisores.service';
import { useAmonestacionesOfflineStore } from '../../stores/amonestaciones-offline.store';

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
  const [vista, setVista] = useState<'tarjetas' | 'tabla'>('tarjetas');

  const { pendientes, sincronizando, sincronizarPendientes } = useAmonestacionesOfflineStore();

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

  const manejarSincronizacion = async () => {
    const { enviadas, fallidas } = await sincronizarPendientes();
    if (enviadas > 0 || fallidas > 0) {
      alert(`Sincronización completada:\n${enviadas} subidas con éxito\n${fallidas} fallidas`);
      cargar();
    }
  };

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
    
    const datosEnvio = {
      trabajadorId: form.trabajadorId,
      supervisorId: form.supervisorId,
      sucursalId: form.sucursalId,
      motivo: motivoFinal,
      severidad: form.severidad,
      descripcion: form.descripcion,
      testimonios: form.testimonios || undefined,
      fechaEvento: form.fechaEvento,
    };

    try {
      await amonestacionesService.crear(datosEnvio);
      cargar();
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || !navigator.onLine) {
        useAmonestacionesOfflineStore.getState().guardarOffline(datosEnvio);
        alert('Sin conexión o error de red. Guardado en dispositivo. Se sincronizará en cuanto haya red.');
      } else {
        setErrorForm(err.response?.data?.message || 'Error al registrar amonestación');
        setGuardando(false);
        return;
      }
    } finally {
      setMostrarModal(false);
      setForm({
        trabajadorId: '', supervisorId: '', sucursalId: '',
        motivo: '', motivoCustom: '',
        severidad: 'LEVE', descripcion: '', testimonios: '',
        fechaEvento: new Date().toISOString().split('T')[0],
      });
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-7 h-7" style={{ color: 'var(--color-advertencia-500)' }} />
            Amonestaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && amonestaciones.length === 0 ? 'Cargando...' : `${amonestaciones.length} registros`}
          </p>
        </div>
        <div className="flex gap-2">
          {pendientes.length > 0 && (
            <button
              onClick={manejarSincronizacion}
              disabled={sincronizando}
              className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg font-medium text-sm transition-all hover:bg-white/10 border"
              style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
            >
              {sincronizando ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-400" />
              )}
              <span className="hidden sm:inline">
                {sincronizando ? 'Sincronizando...' : `Sincronizar (${pendientes.length})`}
              </span>
              <span className="sm:hidden">{pendientes.length}</span>
            </button>
          )}

          <button
            onClick={() => setMostrarModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, var(--color-advertencia-500), #d97706)' }}
          >
            <Plus className="w-5 h-5" /> Nueva Amonestación
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar trabajador, motivo..."
            className="w-full pl-10 pr-4 py-0 h-[48px] rounded-lg text-sm border outline-none transition-colors focus:border-blue-500"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          />
        </div>
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
          <select
            value={filtroSeveridad}
            onChange={e => setFiltroSeveridad(e.target.value)}
            className="w-full pl-10 pr-8 py-0 h-[48px] rounded-lg text-sm border outline-none appearance-none transition-colors focus:border-blue-500"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          >
            <option value="">Todas las severidades</option>
            <option value="LEVE">Leve</option>
            <option value="GRAVE">Grave</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>
        
        {/* Toggle Vista */}
        <div className="hidden md:flex p-[4px] rounded-lg border items-center h-[48px]" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <button
            onClick={() => setVista('tarjetas')}
            className={`w-[40px] h-[38px] flex items-center justify-center rounded-md transition-all duration-200 ${vista === 'tarjetas' ? 'bg-white/10 text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-1 ring-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            title="Vista de tarjetas"
          >
            <LayoutGrid className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => setVista('tabla')}
            className={`w-[40px] h-[38px] flex items-center justify-center rounded-md transition-all duration-200 ${vista === 'tabla' ? 'bg-white/10 text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-1 ring-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            title="Vista de lista"
          >
            <List className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Lista Mobile First (Cards en lugar de Tabla) */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-advertencia-500)', borderTopColor: 'transparent' }} />
        </div>
      ) : amonestacionesFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] rounded-xl border" style={{ borderColor: 'var(--color-borde)' }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron amonestaciones</p>
        </div>
      ) : (
        <>
          {/* Vista Móvil Forzada (Tarjetas) */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {amonestacionesFiltradas.map((a, i) => {
              const sev = SEVERIDAD_CONFIG[a.severidad];
              return (
                <div 
                  key={a.id} 
                  className="p-4 rounded-xl border flex flex-col gap-3 transition-colors hover:bg-white/[0.02] cursor-pointer" 
                  style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)', animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base leading-tight break-words">{a.trabajador?.nombreCompleto}</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-texto-tenue)' }}>{a.trabajador?.dni} · {a.trabajador?.cargo}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: sev.bg, color: sev.color }}>
                      {sev.label}
                    </span>
                  </div>
                  
                  <div className="py-2 border-y my-1" style={{ borderColor: 'var(--color-borde)' }}>
                    <p className="font-medium text-sm leading-snug">{a.motivo}</p>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-texto-secundario)' }}>{a.descripcion}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                    <span className="truncate pr-2">{a.sucursal?.nombre}</span>
                    <span className="whitespace-nowrap flex items-center gap-1">
                      {new Date(a.fechaEvento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Desktop (Tarjetas o Tabla según toggle) */}
          <div className="hidden md:block">
            {vista === 'tarjetas' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {amonestacionesFiltradas.map((a, i) => {
                  const sev = SEVERIDAD_CONFIG[a.severidad];
                  return (
                    <div 
                      key={a.id} 
                      className="p-4 rounded-xl border flex flex-col gap-3 transition-colors hover:bg-white/[0.02] cursor-pointer" 
                      style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)', animationDelay: `${i * 30}ms` }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base leading-tight break-words">{a.trabajador?.nombreCompleto}</h3>
                          <p className="text-xs mt-1" style={{ color: 'var(--color-texto-tenue)' }}>{a.trabajador?.dni} · {a.trabajador?.cargo}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: sev.bg, color: sev.color }}>
                          {sev.label}
                        </span>
                      </div>
                      
                      <div className="py-2 border-y my-1" style={{ borderColor: 'var(--color-borde)' }}>
                        <p className="font-medium text-sm leading-snug">{a.motivo}</p>
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-texto-secundario)' }}>{a.descripcion}</p>
                      </div>

                      <div className="flex justify-between items-center text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                        <span className="truncate pr-2">{a.sucursal?.nombre}</span>
                        <span className="whitespace-nowrap flex items-center gap-1">
                          {new Date(a.fechaEvento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-borde)' }}>
                {/* Vista de Tabla */}
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-fondo-card)' }}>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>Fecha</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>Trabajador</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>Motivo</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>Severidad</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>Sucursal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-borde)' }}>
                    {amonestacionesFiltradas.map((a) => {
                      const sev = SEVERIDAD_CONFIG[a.severidad];
                      return (
                        <tr key={a.id} className="transition-colors hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                            {new Date(a.fechaEvento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-sm">{a.trabajador?.nombreCompleto}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>{a.trabajador?.cargo}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm truncate max-w-[200px]">{a.motivo}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: sev.bg, color: sev.color }}>
                              {sev.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {a.sucursal?.nombre || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Alta Rápida */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 animate-fade-in">
          <div className="w-full h-full sm:h-auto sm:max-w-lg sm:rounded-2xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
            {/* Header modal */}
            <div className="p-4 sm:p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" style={{ color: 'var(--color-advertencia-500)' }} />
                Nueva Amonestación
              </h3>
              <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form id="form-amon" onSubmit={manejarGuardar} className="flex-1 p-4 sm:p-5 space-y-5 overflow-y-auto">
              {errorForm && (
                <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>
                  {errorForm}
                </div>
              )}

              {/* Trabajador */}
              <div>
                <label htmlFor="trabajadorId" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Trabajador <span className="text-red-500">*</span></label>
                <select id="trabajadorId" required value={form.trabajadorId} onChange={e => setForm({ ...form, trabajadorId: e.target.value })} className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
                  <option value="">Seleccionar trabajador...</option>
                  {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombreCompleto} — {t.dni}</option>)}
                </select>
              </div>

              {/* Supervisor y Sucursal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="supervisorId" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Supervisor <span className="text-red-500">*</span></label>
                  <select id="supervisorId" required value={form.supervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })} className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="">Seleccionar...</option>
                    {supervisores.map(s => <option key={s.id} value={s.id}>{s.usuario?.nombreCompleto || s.nombreCompleto}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="sucursalId" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Sucursal <span className="text-red-500">*</span></label>
                  <select id="sucursalId" required value={form.sucursalId} onChange={e => setForm({ ...form, sucursalId: e.target.value })} className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label htmlFor="motivo" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Motivo principal <span className="text-red-500">*</span></label>
                <select id="motivo" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
                  <option value="">Seleccionar motivo...</option>
                  {MOTIVOS_ESTANDAR.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {form.motivo === 'Otro' && (
                  <input id="motivoCustom" aria-label="motivo personalizado" value={form.motivoCustom} onChange={e => setForm({ ...form, motivoCustom: e.target.value })} placeholder="Especifique el motivo..." className="mt-3 w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }} />
                )}
              </div>

              {/* Severidad y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="severidad" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Severidad <span className="text-red-500">*</span></label>
                  <select id="severidad" value={form.severidad} onChange={e => setForm({ ...form, severidad: e.target.value as SeveridadFalta })} className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base font-bold bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)', color: SEVERIDAD_CONFIG[form.severidad].color }}>
                    <option value="LEVE">⚠️ Leve</option>
                    <option value="GRAVE">🔶 Grave</option>
                    <option value="CRITICA">🔴 Crítica</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fechaEvento" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Fecha Evento <span className="text-red-500">*</span></label>
                  <input id="fechaEvento" required type="date" value={form.fechaEvento} onChange={e => setForm({ ...form, fechaEvento: e.target.value })} className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }} />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Relatoría de los hechos <span className="text-red-500">*</span></label>
                <textarea id="descripcion" required rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describa cómo, cuándo y dónde ocurrió el incidente..." className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors resize-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>

              {/* Testimonios */}
              <div>
                <label htmlFor="testimonios" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Testimonios (opcional)</label>
                <textarea id="testimonios" rows={2} value={form.testimonios} onChange={e => setForm({ ...form, testimonios: e.target.value })} placeholder="Nombres o declaraciones de testigos..." className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none focus:border-blue-500 transition-colors resize-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
              
              {/* Espacio extra al final para scroll cómodo en móvil */}
              <div className="h-4"></div>
            </form>

            <div className="p-4 sm:p-5 border-t flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-principal)' }}>
              <button type="button" onClick={() => setMostrarModal(false)} className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] text-base font-medium hover:bg-white/10 rounded-lg transition-colors active:scale-[0.98]">
                Cancelar
              </button>
              <button form="form-amon" type="submit" disabled={guardando} className="w-full sm:w-auto px-8 py-3.5 min-h-[48px] text-base font-bold text-white rounded-lg transition-transform disabled:opacity-50 active:scale-[0.98] shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-advertencia-500), #d97706)' }}>
                {guardando ? 'Guardando...' : 'Registrar Amonestación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
