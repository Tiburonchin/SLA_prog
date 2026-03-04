import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equiposService, type Equipo } from '../../services/equipos.service';
import { Wrench, Plus, Search, ChevronRight, AlertTriangle, CheckCircle, Pause } from 'lucide-react';

const ESTADO_BADGE: Record<string, { label: string; color: string; bg: string; icono: typeof CheckCircle }> = {
  OPERATIVO: { label: 'Operativo', color: 'var(--color-exito-500)', bg: 'rgba(34,197,94,0.15)', icono: CheckCircle },
  EN_MANTENIMIENTO: { label: 'En Mantenimiento', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)', icono: Pause },
  BAJA_TECNICA: { label: 'Baja Técnica', color: 'var(--color-peligro-500)', bg: 'rgba(239,68,68,0.15)', icono: AlertTriangle },
};

function diasHastaVencimiento(fecha?: string): { dias: number; texto: string; color: string } | null {
  if (!fecha) return null;
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { dias: diff, texto: `Vencida hace ${Math.abs(diff)}d`, color: 'var(--color-peligro-500)' };
  if (diff <= 30) return { dias: diff, texto: `${diff}d para vencer`, color: 'var(--color-advertencia-500)' };
  return { dias: diff, texto: `${diff}d restantes`, color: 'var(--color-exito-500)' };
}

export default function PaginaEquipos() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', numeroSerie: '', marca: '', modelo: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await equiposService.obtenerTodos(busqueda || undefined, filtroEstado || undefined);
      setEquipos(data);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, [filtroEstado]);
  useEffect(() => {
    const t = setTimeout(() => cargarDatos(), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true); setErrorForm('');
    try {
      await equiposService.crear({ ...form, marca: form.marca || undefined, modelo: form.modelo || undefined, descripcion: form.descripcion || undefined });
      setMostrarForm(false);
      setForm({ nombre: '', numeroSerie: '', marca: '', modelo: '', descripcion: '' });
      cargarDatos();
    } catch (err: any) { setErrorForm(err.response?.data?.message || 'Error al crear equipo'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wrench className="w-7 h-7" style={{ color: 'var(--color-primary-400)' }} />
            Equipos y Calibraciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && equipos.length === 0 ? 'Cargando...' : `${equipos.length} equipos registrados`}
          </p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
          <Plus className="w-4 h-4" /> Nuevo Equipo
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="rounded-xl p-6 border animate-fade-in" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <h3 className="text-lg font-semibold mb-4">Registrar Equipo</h3>
          {errorForm && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>{errorForm}</div>}
          <form onSubmit={manejarCrear} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'nombre', label: 'Nombre del Equipo', required: true },
              { key: 'numeroSerie', label: 'N° de Serie', required: true },
              { key: 'marca', label: 'Marca' },
              { key: 'modelo', label: 'Modelo' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  {f.label} {f.required && <span style={{ color: 'var(--color-peligro-500)' }}>*</span>}
                </label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.required}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2"
                  style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
              </div>
            ))}
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2 resize-none"
                style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
            </div>
            <div className="col-span-full flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/5" style={{ color: 'var(--color-texto-secundario)' }}>Cancelar</button>
              <button type="submit" disabled={guardando}
                className="px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}>
                {guardando ? 'Guardando...' : 'Guardar Equipo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, serie o marca..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm border outline-none appearance-none transition"
          style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
          <option value="">Todos los estados</option>
          <option value="OPERATIVO">Operativo</option>
          <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
          <option value="BAJA_TECNICA">Baja Técnica</option>
        </select>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
        </div>
      ) : equipos.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron equipos</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-borde)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-fondo-card)' }}>
                {['Equipo', 'N° Serie', 'Marca / Modelo', 'Estado', 'Próx. Calibración', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipos.map((eq) => {
                const badge = ESTADO_BADGE[eq.estado];
                const ultimaCal = eq.calibraciones?.[0];
                const venc = diasHastaVencimiento(ultimaCal?.proximaCalibracion);
                return (
                  <tr key={eq.id} className="border-t cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'var(--color-borde)' }}
                    onClick={() => navigate(`/equipos/${eq.id}`)}>
                    <td className="px-4 py-3 font-medium">{eq.nombre}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{eq.numeroSerie}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>
                      {[eq.marca, eq.modelo].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                        <badge.icono className="w-3 h-3" /> {badge?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {venc ? (
                        <span className="text-xs font-medium" style={{ color: venc.color }}>{venc.texto}</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Sin calibración</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
