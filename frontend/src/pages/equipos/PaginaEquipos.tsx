import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equiposService, type Equipo } from '../../services/equipos.service';
import { Wrench, Plus, Search, ChevronRight, AlertTriangle, CheckCircle, Pause, Wifi, ShieldAlert } from 'lucide-react';
import { useNfcReader } from '../../hooks/useNfcReader';

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
  
  const { leerNfc, leyendo, soportado, error: nfcError, cancelarLectura } = useNfcReader();
  const [modalNfc, setModalNfc] = useState(false);

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

  const iniciarEscaneoNfc = async () => {
    setModalNfc(true);
    const tagId = await leerNfc();
    if (tagId) {
      try {
        const equipoNfc = await equiposService.obtenerPorNfc(tagId);
        setModalNfc(false);
        navigate(`/equipos/${equipoNfc.id}`);
      } catch (err: any) {
        setModalNfc(false);
        alert(err.response?.data?.message || 'Tag NFC no pertenece a ningún equipo.');
      }
    }
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
        <div className="flex items-center gap-3">
          {soportado && (
            <button onClick={iniciarEscaneoNfc} disabled={leyendo}
              className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg border font-medium text-sm transition-all hover:bg-white/[0.05] active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: 'var(--color-primary-500)', color: 'var(--color-primary-400)' }}>
              <Wifi className="w-4 h-4" /> Escanear NFC
            </button>
          )}
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        </div>
      </div>

      {modalNfc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center animate-fade-in">
          <Wifi className={`w-24 h-24 mb-6 ${leyendo ? 'text-blue-500 animate-ping' : 'text-red-500'}`} />
          <h2 className="text-2xl font-black text-white mb-2">Escáner NFC Activo</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-sm">
            {nfcError || 'Acerque la zona superior trasera de su teléfono al Tag NFC del equipo.'}
          </p>
          <button onClick={() => { cancelarLectura(); setModalNfc(false); }}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition">
            Cancelar / Volver
          </button>
        </div>
      )}

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
              { key: 'nfcTagId', label: 'Tag NFC (Opcional)' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  {f.label} {f.required && <span style={{ color: 'var(--color-peligro-500)' }}>*</span>}
                </label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.required}
                  className="w-full px-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
                  style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
              </div>
            ))}
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2}
                className="w-full px-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2 resize-none"
                style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
            </div>
            <div className="col-span-full flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="px-4 py-3 min-h-[48px] w-full sm:w-auto rounded-lg text-sm font-medium transition hover:bg-white/5" style={{ color: 'var(--color-texto-secundario)' }}>Cancelar</button>
              <button type="submit" disabled={guardando}
                className="px-5 py-3 min-h-[48px] w-full sm:w-auto rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}>
                {guardando ? 'Guardando...' : 'Guardar Equipo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, serie o marca..."
            className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
        </div>
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none appearance-none transition"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
            <option value="">Todos los estados</option>
            <option value="OPERATIVO">Operativo</option>
            <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
            <option value="BAJA_TECNICA">Baja Técnica</option>
          </select>
        </div>
      </div>

      {/* Grid Cards (Mobile) & Tabla (Desktop) */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-loader p-4 rounded-xl border flex flex-col gap-3 h-[140px]" />
          ))}
        </div>
      ) : equipos.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron equipos</p>
        </div>
      ) : (
        <>
          {/* Vista Móvil (Tarjetas) */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {equipos.map((eq) => {
              const badge = ESTADO_BADGE[eq.estado];
              const ultimaCal = eq.calibraciones?.[0];
              const venc = diasHastaVencimiento(ultimaCal?.proximaCalibracion);
              return (
                <div key={eq.id} className="p-4 rounded-xl border flex flex-col gap-3 transition-colors hover:bg-white/[0.04] cursor-pointer" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }} onClick={() => navigate(`/equipos/${eq.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-tight break-words">{eq.nombre}</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>SN: {eq.numeroSerie}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                  </div>
                  <div className="py-2 border-y my-1" style={{ borderColor: 'var(--color-borde)' }}>
                    <p className="font-medium text-sm">{[eq.marca, eq.modelo].filter(Boolean).join(' ') || 'Sin Marca/Modelo'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                        <badge.icono className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{badge?.label}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    {venc ? (
                      <span className="font-semibold text-xs" style={{ color: venc.color }}>{venc.texto}</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Sin calibración</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Desktop (Tabla) */}
          <div className="hidden md:block rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--color-borde)' }}>
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
        </>
      )}
    </div>
  );
}
