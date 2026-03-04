import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equiposService, type Equipo } from '../../services/equipos.service';
import {
  ArrowLeft, Wrench, CheckCircle, Pause, AlertTriangle,
  Plus, Calendar, FileText, Edit3, Save, X, Trash2
} from 'lucide-react';

const ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  OPERATIVO: { label: 'Operativo', color: 'var(--color-exito-500)', bg: 'rgba(34,197,94,0.15)' },
  EN_MANTENIMIENTO: { label: 'En Mantenimiento', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)' },
  BAJA_TECNICA: { label: 'Baja Técnica', color: 'var(--color-peligro-500)', bg: 'rgba(239,68,68,0.15)' },
};

export default function PaginaDetalleEquipo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormCal, setMostrarFormCal] = useState(false);
  const [formCal, setFormCal] = useState({ fechaCalibracion: '', proximaCalibracion: '', observaciones: '' });
  const [guardando, setGuardando] = useState(false);

  // Estados de edición y baja
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState<Partial<Equipo>>({});
  const [desactivando, setDesactivando] = useState(false);

  const cargar = () => {
    if (!id) return;
    setCargando(true);
    equiposService.obtenerPorId(id)
      .then(data => {
        setEquipo(data);
        setFormEdit(data);
      })
      .catch(() => navigate('/equipos'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [id]);

  const agregarCalibracion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setGuardando(true);
    try {
      await equiposService.agregarCalibracion({ equipoId: id, ...formCal, observaciones: formCal.observaciones || undefined });
      setMostrarFormCal(false);
      setFormCal({ fechaCalibracion: '', proximaCalibracion: '', observaciones: '' });
      cargar();
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  };

  const guardarCambios = async () => {
    if (!id) return;
    setGuardando(true);
    try {
      await equiposService.actualizar(id, {
        marca: formEdit.marca || undefined,
        modelo: formEdit.modelo || undefined,
        descripcion: formEdit.descripcion || undefined,
      });
      setEditando(false);
      cargar();
    } catch (error) {
      console.error('Error al actualizar', error);
    } finally {
      setGuardando(false);
    }
  };

  const manejarDesactivar = async () => {
    if (!id || equipo?.estado === 'BAJA_TECNICA') return;
    if (!window.confirm(`¿Estás seguro de dar de baja técnica al equipo ${equipo?.nombre}?`)) return;
    
    setDesactivando(true);
    try {
      await equiposService.desactivar(id);
      cargar();
    } catch (err) { console.error(err); }
    finally { setDesactivando(false); }
  };

  if (cargando) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!equipo) return null;

  const badge = ESTADO[equipo.estado];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 relative group">
        <button onClick={() => navigate('/equipos')} className="p-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--color-texto-secundario)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wrench className="w-6 h-6" style={{ color: 'var(--color-primary-400)' }} />
            {equipo.nombre}
          </h1>
          {editando ? (
            <div className="mt-2 flex gap-3 max-w-md">
               <input value={formEdit.marca || ''} onChange={e => setFormEdit({...formEdit, marca: e.target.value})} placeholder="Marca" className="flex-1 px-2 py-1 bg-transparent border-b border-gray-600 text-sm outline-none w-full" />
               <input value={formEdit.modelo || ''} onChange={e => setFormEdit({...formEdit, modelo: e.target.value})} placeholder="Modelo" className="flex-1 px-2 py-1 bg-transparent border-b border-gray-600 text-sm outline-none w-full" />
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
              Serie: {equipo.numeroSerie} {equipo.marca && `• ${equipo.marca}`} {equipo.modelo && equipo.modelo}
            </p>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-3">
           {!editando && equipo.estado !== 'BAJA_TECNICA' ? (
             <button onClick={() => setEditando(true)} className="p-2 bg-black/20 rounded hover:bg-black/40 text-gray-400 hover:text-white transition">
               <Edit3 className="w-4 h-4" />
             </button>
           ) : editando && (
             <>
               <button onClick={guardarCambios} disabled={guardando} className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/40 transition">
                 <Save className="w-4 h-4" />
               </button>
               <button onClick={() => { setEditando(false); setFormEdit(equipo!); }} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 transition">
                 <X className="w-4 h-4" />
               </button>
             </>
           )}

          <span className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
            {badge?.label}
          </span>
        </div>
      </div>

      {editando && (
        <div className="mb-4">
          <label className="block text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Descripción del Equipo</label>
          <textarea value={formEdit.descripcion || ''} onChange={e => setFormEdit({...formEdit, descripcion: e.target.value})} rows={2} placeholder="Añada una descripción..." 
            className="w-full px-3 py-2 bg-transparent border rounded-lg text-sm outline-none" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
        </div>
      )}
      {!editando && equipo.descripcion && (
        <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>{equipo.descripcion}</p>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Total Calibraciones</p>
          <p className="text-2xl font-bold">{equipo.calibraciones?.length || 0}</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Última Calibración</p>
          <p className="text-lg font-bold">
            {equipo.calibraciones?.[0] ? new Date(equipo.calibraciones[0].fechaCalibracion).toLocaleDateString('es-MX') : '—'}
          </p>
        </div>
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Próximo Vencimiento</p>
          <p className="text-lg font-bold" style={{
            color: equipo.calibraciones?.[0]?.proximaCalibracion && new Date(equipo.calibraciones[0].proximaCalibracion) < new Date()
              ? 'var(--color-peligro-500)' : 'var(--color-texto-principal)'
          }}>
            {equipo.calibraciones?.[0] ? new Date(equipo.calibraciones[0].proximaCalibracion).toLocaleDateString('es-MX') : '—'}
          </p>
        </div>
      </div>

      {/* Historial de calibraciones */}
      <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: 'var(--color-primary-400)' }} />
            Historial de Calibraciones
          </h3>
          <button onClick={() => setMostrarFormCal(!mostrarFormCal)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
            <Plus className="w-4 h-4" /> Nueva Calibración
          </button>
        </div>

        {/* Form calibración */}
        {mostrarFormCal && (
          <form onSubmit={agregarCalibracion} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-lg animate-fade-in" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                Fecha Calibración <span style={{ color: 'var(--color-peligro-500)' }}>*</span>
              </label>
              <input type="date" value={formCal.fechaCalibracion} onChange={e => setFormCal({ ...formCal, fechaCalibracion: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                Próx. Calibración <span style={{ color: 'var(--color-peligro-500)' }}>*</span>
              </label>
              <input type="date" value={formCal.proximaCalibracion} onChange={e => setFormCal({ ...formCal, proximaCalibracion: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Observaciones</label>
              <input value={formCal.observaciones} onChange={e => setFormCal({ ...formCal, observaciones: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
            </div>
            <div className="col-span-full flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarFormCal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Cancelar</button>
              <button type="submit" disabled={guardando} className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        {equipo.calibraciones?.length ? (
          <div className="space-y-3">
            {equipo.calibraciones.map(cal => {
              const vencida = new Date(cal.proximaCalibracion) < new Date();
              return (
                <div key={cal.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: vencida ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }}>
                      {vencida ? <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-peligro-500)' }} /> : <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-exito-500)' }} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{new Date(cal.fechaCalibracion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      {cal.observaciones && <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{cal.observaciones}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Próxima:</p>
                    <p className="text-sm font-medium" style={{ color: vencida ? 'var(--color-peligro-500)' : 'var(--color-texto-principal)' }}>
                      {new Date(cal.proximaCalibracion).toLocaleDateString('es-MX')}
                      {vencida && ' ⚠'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-texto-tenue)' }} />
            <p style={{ color: 'var(--color-texto-secundario)' }}>Sin calibraciones registradas</p>
          </div>
        )}
      </div>

      {/* Info Account & Baja técnica */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs px-4" style={{ color: 'var(--color-texto-tenue)' }}>
          Registrado el: {new Date(equipo.creadoEn).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {equipo.estado !== 'BAJA_TECNICA' && (
          <button onClick={manejarDesactivar} disabled={desactivando}
            className="text-xs font-medium transition hover:underline disabled:opacity-50 px-4 flex items-center gap-1.5"
            style={{ color: 'var(--color-peligro-500)' }}>
            <Trash2 className="w-3.5 h-3.5" />
            {desactivando ? 'Dando de baja...' : 'Dar de Baja Técnica'}
          </button>
        )}
      </div>
    </div>
  );
}
