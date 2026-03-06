import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, Search, Filter, X, CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';
import { inspeccionesService, type Inspeccion, type ItemChecklist, type CrearInspeccionData } from '../../services/inspecciones.service';
import { sucursalesService, trabajadoresService, type Sucursal, type Trabajador } from '../../services/trabajadores.service';
import { supervisoresService } from '../../services/supervisores.service';
import { matrizIpcService } from '../../services/matrizIpc.service';
import FormularioWizard from '../../components/forms/FormularioWizard';

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
          className="flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}>
          <Plus className="w-5 h-5" /> Nueva Inspección
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por tipo, ubicación, sucursal..."
            className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
        </div>
        <div className="relative w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="w-full sm:w-auto pl-10 pr-8 py-3 min-h-[48px] rounded-lg text-sm border outline-none appearance-none"
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

      {/* Modal Wizard de Crear Inspección */}
      {mostrarModal && (
        <FormularioWizard
          titulo="Nueva Inspección"
          icono={<ClipboardCheck className="w-5 h-5" style={{ color: 'var(--color-exito-500)' }} />}
          guardando={guardando}
          textoBotonFinal="Crear Inspección"
          onCancelar={() => setMostrarModal(false)}
          onSubmit={async () => {
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
              throw err;
            } finally { setGuardando(false); }
          }}
          pasos={[
            {
              titulo: 'Datos Base',
              descripcion: 'Supervisor, sucursal y ubicación de la inspección.',
              validar: () => {
                if (!form.supervisorId) return 'Seleccione un supervisor.';
                if (!form.sucursalId) return 'Seleccione una sucursal.';
                if (!form.ubicacion.trim()) return 'La ubicación es obligatoria.';
                return true;
              },
              contenido: (
                <>
                  {errorForm && (
                    <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>{errorForm}</div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Supervisor <span className="text-red-500">*</span></label>
                    <select required value={form.supervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })}
                      className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                      <option value="">Seleccionar...</option>
                      {supervisores.map(s => <option key={s.id} value={s.id}>{s.usuario?.nombreCompleto}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Sucursal <span className="text-red-500">*</span></label>
                    <select required value={form.sucursalId} onChange={e => setForm({ ...form, sucursalId: e.target.value })}
                      className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }}>
                      <option value="">Seleccionar...</option>
                      {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Ubicación / Zona <span className="text-red-500">*</span></label>
                    <input required value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                      placeholder="Ej: Área de soldadura, Piso 3..."
                      className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }} />
                  </div>
                </>
              ),
            },
            {
              titulo: 'Tipo de Trabajo',
              descripcion: 'El checklist se auto-genera según el tipo de trabajo seleccionado.',
              validar: () => {
                if (!form.tipoTrabajo.trim()) return 'El tipo de trabajo es obligatorio.';
                return true;
              },
              contenido: (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Tipo de Trabajo <span className="text-red-500">*</span></label>
                    <input required value={form.tipoTrabajo}
                      onChange={e => handleTipoTrabajoChange(e.target.value)}
                      placeholder="Ej: Trabajo en Altura, Excavación..."
                      className="w-full px-4 py-3 min-h-[48px] rounded-lg text-base bg-transparent border outline-none" style={{ borderColor: 'var(--color-borde)' }} />
                  </div>
                  {checklistPreview.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-texto-secundario)' }}>Checklist ({checklistPreview.length} ítems)</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg p-2" style={{ backgroundColor: 'var(--color-fondo-card)', border: '1px solid var(--color-borde)' }}>
                        {checklistPreview.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 min-h-[48px] rounded-lg hover:bg-white/5 transition border border-transparent" style={{ borderColor: item.aprobado ? 'var(--color-exito-500)' : 'transparent', backgroundColor: item.aprobado ? 'rgba(34,197,94,0.05)' : 'transparent' }}>
                            <input type="checkbox" checked={item.aprobado} onChange={() => toggleCheckItem(idx)} className="w-6 h-6 rounded" />
                            <span className="text-sm">{item.descripcion}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ),
            },
            {
              titulo: 'Trabajadores',
              descripcion: 'Seleccione los trabajadores presentes en la zona (opcional).',
              contenido: (
                <>
                  {trabajadores.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: 'var(--color-texto-tenue)' }}>No hay trabajadores registrados.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {trabajadores
                        .filter(t => !form.sucursalId || t.sucursalId === form.sucursalId)
                        .map(t => {
                          const seleccionado = form.trabajadorIds?.includes(t.id) || false;
                          return (
                            <label key={t.id} className={`flex items-center gap-3 cursor-pointer p-3 min-h-[48px] rounded-lg border transition ${seleccionado ? 'border-blue-500 bg-blue-500/5' : 'border-transparent hover:bg-white/5'}`}>
                              <input type="checkbox" checked={seleccionado} onChange={() => {
                                const ids = form.trabajadorIds || [];
                                setForm({ ...form, trabajadorIds: seleccionado ? ids.filter(id => id !== t.id) : [...ids, t.id] });
                              }} className="w-6 h-6 rounded" />
                              <div>
                                <p className="text-sm font-medium">{t.nombreCompleto}</p>
                                <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{t.cargo} — {t.dni}</p>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
