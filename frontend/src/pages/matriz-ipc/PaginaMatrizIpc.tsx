import { useState, useEffect } from 'react';
import { matrizIpcService, type MatrizIpc } from '../../services/matrizIpc.service';
import { ShieldCheck, Plus, Search, Edit3, Trash2, X, CheckCircle } from 'lucide-react';

export default function PaginaMatrizIpc() {
  const [matrices, setMatrices] = useState<MatrizIpc[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState<{
    id?: string, cargo: string, ubicacion: string,
    eppsObligatorios: string[], herramientasRequeridas: string[],
    capacitacionesRequeridas: string[], descripcion: string
  }>({ cargo: '', ubicacion: '', eppsObligatorios: [], herramientasRequeridas: [], capacitacionesRequeridas: [], descripcion: '' });
  
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [inputEpp, setInputEpp] = useState('');
  const [inputHerr, setInputHerr] = useState('');
  const [inputCap, setInputCap] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await matrizIpcService.obtenerTodos();
      // Filtrado simple front-end por ahora
      if (busqueda) {
        setMatrices(data.filter(m => 
          m.cargo.toLowerCase().includes(busqueda.toLowerCase()) || 
          m.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
        ));
      } else {
        setMatrices(data);
      }
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, [busqueda]);

  const abrirCreacion = () => {
    setForm({ cargo: '', ubicacion: '', eppsObligatorios: [], herramientasRequeridas: [], capacitacionesRequeridas: [], descripcion: '' });
    setErrorForm('');
    setMostrarModal(true);
  };

  const abrirEdicion = (m: MatrizIpc) => {
    setForm({
      id: m.id,
      cargo: m.cargo,
      ubicacion: m.ubicacion,
      eppsObligatorios: m.eppsObligatorios || [],
      herramientasRequeridas: m.herramientasRequeridas || [],
      capacitacionesRequeridas: m.capacitacionesRequeridas || [],
      descripcion: m.descripcion || ''
    });
    setErrorForm('');
    setMostrarModal(true);
  };

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      if (form.id) {
        await matrizIpcService.actualizar(form.id, {
          cargo: form.cargo, ubicacion: form.ubicacion,
          eppsObligatorios: form.eppsObligatorios, herramientasRequeridas: form.herramientasRequeridas, capacitacionesRequeridas: form.capacitacionesRequeridas, descripcion: form.descripcion
        });
      } else {
        await matrizIpcService.crear({
          cargo: form.cargo, ubicacion: form.ubicacion,
          eppsObligatorios: form.eppsObligatorios, herramientasRequeridas: form.herramientasRequeridas, capacitacionesRequeridas: form.capacitacionesRequeridas, descripcion: form.descripcion
        });
      }
      setMostrarModal(false);
      cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.message || 'Error al guardar la Matriz IPC');
    } finally {
      setGuardando(false);
    }
  };

  const agregarTag = (campo: 'eppsObligatorios'|'herramientasRequeridas'|'capacitacionesRequeridas', valor: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (!valor.trim()) return;
    setForm(prev => ({ ...prev, [campo]: [...prev[campo], valor.trim()] }));
    setter('');
  };

  const quitarTag = (campo: 'eppsObligatorios'|'herramientasRequeridas'|'capacitacionesRequeridas', idx: number) => {
    setForm(prev => ({ ...prev, [campo]: prev[campo].filter((_, i) => i !== idx) }));
  };

  const manejarDesactivar = async (id: string, cargo: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar la matriz para ${cargo}?`)) return;
    try {
      await matrizIpcService.desactivar(id);
      cargarDatos();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-7 h-7" style={{ color: 'var(--color-primary-400)' }} />
            Catálogo Matriz IPC
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            Estandarización de equipamiento y capacitaciones requeridas por cargo y zona.
          </p>
        </div>
        <button onClick={abrirCreacion}
          className="flex items-center gap-2 px-5 min-h-[48px] rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
          <Plus className="w-5 h-5" /> Agregar Registro
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cargo o ubicación..."
          className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
          style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
        </div>
      ) : matrices.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}>
          <ShieldCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron matrices activas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matrices.map(m => (
            <div key={m.id} className="rounded-xl border p-5 flex flex-col" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}>
              <div className="flex justify-between items-start mb-3">
                <div className="pr-4">
                  <h3 className="font-bold text-lg leading-tight">{m.cargo}</h3>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-primary-400)' }}>{m.ubicacion}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => abrirEdicion(m)} className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg bg-black/20 text-gray-400 hover:text-white transition">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => manejarDesactivar(m.id, m.cargo)} className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg bg-black/20 text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>EPPs Obligatorios</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.eppsObligatorios.map((epp, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">{epp}</span>
                    ))}
                    {m.eppsObligatorios.length === 0 && <span className="text-xs text-gray-500">-</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Herramientas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.herramientasRequeridas.map((herr, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">{herr}</span>
                    ))}
                    {m.herramientasRequeridas.length === 0 && <span className="text-xs text-gray-500">-</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Capacitaciones</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.capacitacionesRequeridas.map((cap, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-md flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20">
                         <CheckCircle className="w-3 h-3" /> {cap}
                      </span>
                    ))}
                    {m.capacitacionesRequeridas.length === 0 && <span className="text-xs text-gray-500">-</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 sm:p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col sm:max-h-[90vh]" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
            <div className="flex justify-between items-center p-4 border-b bg-black/10" style={{ borderColor: 'var(--color-borde)' }}>
              <h2 className="text-lg font-bold">{form.id ? 'Editar Matriz IPC' : 'Nueva Matriz IPC'}</h2>
              <button type="button" onClick={() => setMostrarModal(false)} className="p-1.5 transition rounded-lg hover:bg-white/5" style={{ color: 'var(--color-texto-secundario)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {errorForm && <div className="mb-3 p-3 rounded-lg text-sm bg-red-500/10 text-red-500 border border-red-500/20">{errorForm}</div>}
              <form id="form-matriz" onSubmit={manejarGuardar} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>Cargo <span className="text-red-500">*</span></label>
                    <input required value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} className="w-full px-3 py-2 min-h-[40px] rounded-lg text-sm border outline-none bg-black/5 focus:border-primary-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej: Soldador" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>Ubicación <span className="text-red-500">*</span></label>
                    <input required value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} className="w-full px-3 py-2 min-h-[40px] rounded-lg text-sm border outline-none bg-black/5 focus:border-primary-500 transition-colors" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej: Planta Central" />
                  </div>
                </div>

                {/* EPPs */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>EPPs Obligatorios</label>
                  <div className="flex rounded-lg border focus-within:border-primary-500 transition-colors mb-2 overflow-hidden bg-black/5" style={{borderColor: 'var(--color-borde)'}}>
                    <input value={inputEpp} onChange={e => setInputEpp(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarTag('eppsObligatorios', inputEpp, setInputEpp); } }} className="flex-1 px-3 py-2 min-h-[40px] text-sm bg-transparent outline-none" placeholder="Añadir EPP..." />
                    <button type="button" onClick={() => agregarTag('eppsObligatorios', inputEpp, setInputEpp)} className="px-3 min-w-[40px] flex items-center justify-center hover:bg-black/10 transition-colors border-l" style={{borderColor: 'var(--color-borde)'}}><Plus className="w-4 h-4 text-gray-400"/></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.eppsObligatorios.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 flex items-center gap-1">{tag} <button type="button" onClick={() => quitarTag('eppsObligatorios', i)} className="hover:text-red-400 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button></span>
                    ))}
                  </div>
                </div>

                {/* Herramientas */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>Herramientas Requeridas</label>
                  <div className="flex rounded-lg border focus-within:border-primary-500 transition-colors mb-2 overflow-hidden bg-black/5" style={{borderColor: 'var(--color-borde)'}}>
                    <input value={inputHerr} onChange={e => setInputHerr(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarTag('herramientasRequeridas', inputHerr, setInputHerr); } }} className="flex-1 px-3 py-2 min-h-[40px] text-sm bg-transparent outline-none" placeholder="Añadir Herramienta..." />
                    <button type="button" onClick={() => agregarTag('herramientasRequeridas', inputHerr, setInputHerr)} className="px-3 min-w-[40px] flex items-center justify-center hover:bg-black/10 transition-colors border-l" style={{borderColor: 'var(--color-borde)'}}><Plus className="w-4 h-4 text-gray-400"/></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.herramientasRequeridas.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded border border-orange-500/20 bg-orange-500/10 text-orange-400 flex items-center gap-1">{tag} <button type="button" onClick={() => quitarTag('herramientasRequeridas', i)} className="hover:text-red-400 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button></span>
                    ))}
                  </div>
                </div>

                {/* Capacitaciones */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>Capacitaciones Exigidas</label>
                  <div className="flex rounded-lg border focus-within:border-primary-500 transition-colors mb-2 overflow-hidden bg-black/5" style={{borderColor: 'var(--color-borde)'}}>
                    <input value={inputCap} onChange={e => setInputCap(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarTag('capacitacionesRequeridas', inputCap, setInputCap); } }} className="flex-1 px-3 py-2 min-h-[40px] text-sm bg-transparent outline-none" placeholder="Añadir Capacitación..." />
                    <button type="button" onClick={() => agregarTag('capacitacionesRequeridas', inputCap, setInputCap)} className="px-3 min-w-[40px] flex items-center justify-center hover:bg-black/10 transition-colors border-l" style={{borderColor: 'var(--color-borde)'}}><Plus className="w-4 h-4 text-gray-400"/></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.capacitacionesRequeridas.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded border border-green-500/20 bg-green-500/10 text-green-500 flex items-center gap-1">{tag} <button type="button" onClick={() => quitarTag('capacitacionesRequeridas', i)} className="hover:text-red-400 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button></span>
                    ))}
                  </div>
                </div>

                {/* Descripcion */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>Notas adicionales</label>
                  <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={2} className="w-full px-3 py-2 min-h-[40px] border rounded-lg text-sm bg-black/5 outline-none focus:border-primary-500 transition-colors resize-none" style={{borderColor: 'var(--color-borde)'}} placeholder="Comentarios..." />
                </div>
              </form>
            </div>

            <div className="p-4 border-t flex justify-end gap-3 flex-col sm:flex-row bg-black/10" style={{ borderColor: 'var(--color-borde)' }}>
              <button type="button" onClick={() => setMostrarModal(false)} className="px-4 w-full sm:w-auto min-h-[40px] font-medium bg-white/5 hover:bg-white/10 rounded-lg text-sm transition text-gray-300">Cancelar</button>
              <button form="form-matriz" type="submit" disabled={guardando} className="px-5 w-full sm:w-auto min-h-[40px] font-medium rounded-lg text-sm text-white transition disabled:opacity-50 hover:shadow-lg active:scale-95" style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}>
                {guardando ? 'Guardando...' : form.id ? 'Guardar Cambios' : 'Crear Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
