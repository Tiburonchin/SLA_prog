import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, Search, Filter, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { inspeccionesService, type Inspeccion, type ItemChecklist, type CrearInspeccionData } from '../../services/inspecciones.service';
import { sucursalesService, trabajadoresService, type Sucursal, type Trabajador } from '../../services/trabajadores.service';
import { supervisoresService } from '../../services/supervisores.service';
import { matrizIpcService } from '../../services/matrizIpc.service';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  EN_PROGRESO: { label: 'En Progreso', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Clock },
  COMPLETADA: { label: 'Completada', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: AlertCircle },
};

export default function PaginaInspecciones() {
  const navigate = useNavigate();
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modal crear
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [checklistPreview, setChecklistPreview] = useState<ItemChecklist[]>([]);

  const [form, setForm] = useState<CrearInspeccionData>({
    supervisorId: '',
    sucursalId: '',
    ubicacion: '',
    tipoTrabajo: '',
    checklist: [],
    trabajadorIds: [],
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const [insp, sucs, sups, trabs] = await Promise.all([
        inspeccionesService.obtenerTodas(filtroEstado ? { estado: filtroEstado } : {}),
        sucursalesService.obtenerTodas(),
        supervisoresService.obtenerTodos(),
        trabajadoresService.obtenerTodos(),
      ]);
      setInspecciones(insp.datos);
      setSucursales(sucs);
      setSupervisores(sups);
      setTrabajadores(trabs.datos);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  // Genera checklist automáticamente al seleccionar el tipo de trabajo
  const handleTipoTrabajoChange = async (tipoTrabajo: string) => {
    setForm({ ...form, tipoTrabajo });
    try {
      const matrices = await matrizIpcService.obtenerTodos();
      // Buscar la matriz correspondiente como base para el checklist
      const match = matrices.find((m: any) =>
        m.cargo?.toLowerCase().includes(tipoTrabajo.toLowerCase()) ||
        tipoTrabajo.toLowerCase().includes(m.cargo?.toLowerCase())
      );
      if (match) {
        const items: ItemChecklist[] = [];
        if (match.eppsObligatorios) {
          match.eppsObligatorios.forEach((epp: string) => {
            items.push({ descripcion: `EPP: ${epp}`, aprobado: false });
          });
        }
        if (match.herramientasRequeridas) {
          match.herramientasRequeridas.forEach((h: string) => {
            items.push({ descripcion: `Herramienta: ${h}`, aprobado: false });
          });
        }
        if (match.capacitacionesRequeridas) {
          match.capacitacionesRequeridas.forEach((c: string) => {
            items.push({ descripcion: `Capacitación: ${c}`, aprobado: false });
          });
        }
        setChecklistPreview(items);
        setForm(prev => ({ ...prev, checklist: items }));
      } else {
        // Checklist genérico
        const genericos: ItemChecklist[] = [
          { descripcion: 'EPP completo y en buen estado', aprobado: false },
          { descripcion: 'Área de trabajo señalizada', aprobado: false },
          { descripcion: 'Herramientas calibradas y verificadas', aprobado: false },
          { descripcion: 'Permiso de trabajo vigente', aprobado: false },
          { descripcion: 'Capacitación del personal actualizada', aprobado: false },
        ];
        setChecklistPreview(genericos);
        setForm(prev => ({ ...prev, checklist: genericos }));
      }
    } catch { /* sin checklist auto */ }
  };

  const toggleCheckItem = (idx: number) => {
    const updated = [...checklistPreview];
    updated[idx] = { ...updated[idx], aprobado: !updated[idx].aprobado };
    setChecklistPreview(updated);
    setForm(prev => ({ ...prev, checklist: updated }));
  };

  const inspFiltradas = inspecciones.filter(i => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      i.tipoTrabajo.toLowerCase().includes(q) ||
      i.ubicacion.toLowerCase().includes(q) ||
      i.sucursal?.nombre.toLowerCase().includes(q)
    );
  });

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supervisorId || !form.sucursalId) {
      setErrorForm('Supervisor y Sucursal son obligatorios'); return;
    }
    setGuardando(true);
    setErrorForm('');
    try {
      await inspeccionesService.crear(form);
      setMostrarModal(false);
      setForm({ supervisorId: '', sucursalId: '', ubicacion: '', tipoTrabajo: '', checklist: [], trabajadorIds: [] });
      setChecklistPreview([]);
      cargar();
    } catch (err: any) {
      setErrorForm(err.response?.data?.message || 'Error al crear inspección');
    } finally { setGuardando(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7" style={{ color: 'var(--color-exito-500)' }} />
            Inspecciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && inspecciones.length === 0 ? 'Cargando...' : `${inspecciones.length} inspecciones registradas`}
          </p>
        </div>
        <button onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}>
          <Plus className="w-4 h-4" /> Nueva Inspección
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por tipo, ubicación, sucursal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg text-sm border outline-none appearance-none"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
            <option value="">Todos los estados</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-exito-500)', borderTopColor: 'transparent' }} />
        </div>
      ) : inspFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron inspecciones</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inspFiltradas.map((insp) => {
            const est = ESTADO_CONFIG[insp.estado] || { label: insp.estado, color: '#000', bg: 'transparent', icon: AlertCircle };
            const IconoEstado = est.icon;
            
            let checklistData = insp.checklist || [];
            if (typeof checklistData === 'string') {
              try { checklistData = JSON.parse(checklistData); } catch(e) { checklistData = []; }
            }
            if (!Array.isArray(checklistData)) checklistData = [];
            
            const totalItems = checklistData.length;
            const aprobados = checklistData.filter((i: any) => i.aprobado).length;
            const pct = totalItems > 0 ? Math.round((aprobados / totalItems) * 100) : 0;
            return (
              <div key={insp.id}
                className="rounded-xl p-5 border transition-all hover:shadow-md cursor-pointer"
                style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
                onClick={() => navigate(`/inspecciones/${insp.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{insp.tipoTrabajo}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                      {insp.ubicacion} · {insp.sucursal?.nombre}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: est.bg, color: est.color }}>
                    <IconoEstado className="w-3.5 h-3.5" /> {est.label}
                  </span>
                </div>
                {/* Barra de progreso */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? 'var(--color-exito-500)' : 'var(--color-primary-500)' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{aprobados}/{totalItems}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                  <span>Supervisor: {insp.supervisor?.usuario?.nombreCompleto}</span>
                  <span>{new Date(insp.creadoEn).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear Inspección */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-borde)' }}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--color-exito-500)' }} />
                Nueva Inspección
              </h3>
              <button onClick={() => setMostrarModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>

            <form id="form-insp" onSubmit={manejarCrear} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {errorForm && (
                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>{errorForm}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supervisor <span className="text-red-500">*</span></label>
                  <select required value={form.supervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="">Seleccionar...</option>
                    {supervisores.map(s => <option key={s.id} value={s.id}>{s.usuario?.nombreCompleto}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sucursal <span className="text-red-500">*</span></label>
                  <select required value={form.sucursalId} onChange={e => setForm({ ...form, sucursalId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ubicación / Zona <span className="text-red-500">*</span></label>
                <input required value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                  placeholder="Ej: Área de soldadura, Piso 3..." className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Trabajo <span className="text-red-500">*</span></label>
                <input required value={form.tipoTrabajo}
                  onChange={e => handleTipoTrabajoChange(e.target.value)}
                  placeholder="Ej: Trabajo en Altura, Excavación..." className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>

              {/* Checklist Preview */}
              {checklistPreview.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Checklist Generado ({checklistPreview.length} ítems)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg p-3" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
                    {checklistPreview.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5 transition">
                        <input type="checkbox" checked={item.aprobado} onChange={() => toggleCheckItem(idx)} className="rounded" />
                        <span className="text-sm">{item.descripcion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-borde)' }}>
              <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition">Cancelar</button>
              <button form="form-insp" type="submit" disabled={guardando}
                className="px-5 py-2 text-sm font-bold text-white rounded-lg transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}>
                {guardando ? 'Creando...' : 'Crear Inspección'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
