import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  supervisoresService,
  type Supervisor,
  type UsuarioDisponible,
} from '../../services/supervisores.service';
import { sucursalesService, type Sucursal } from '../../services/trabajadores.service';
import {
  HardHat, Plus, Search, ChevronRight, MapPin,
  ClipboardCheck, AlertTriangle, Phone,
} from 'lucide-react';

export default function PaginaSupervisores() {
  const navigate = useNavigate();
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Form state
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuariosDisp, setUsuariosDisp] = useState<UsuarioDisponible[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [form, setForm] = useState({ usuarioId: '', telefono: '', sucursalIds: [] as string[] });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await supervisoresService.obtenerTodos(busqueda || undefined);
      setSupervisores(data);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const cargarFormData = async () => {
    try {
      const [usuarios, sucs] = await Promise.all([
        supervisoresService.usuariosDisponibles(),
        sucursalesService.obtenerTodas(),
      ]);
      setUsuariosDisp(usuarios);
      setSucursales(sucs);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => {
    const t = setTimeout(() => cargarDatos(), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const abrirForm = () => {
    setMostrarForm(true);
    cargarFormData();
  };

  const toggleSucursal = (id: string) => {
    setForm(prev => ({
      ...prev,
      sucursalIds: prev.sucursalIds.includes(id)
        ? prev.sucursalIds.filter(s => s !== id)
        : [...prev.sucursalIds, id],
    }));
  };

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true); setErrorForm('');
    try {
      await supervisoresService.crear({
        usuarioId: form.usuarioId,
        telefono: form.telefono || undefined,
        sucursalIds: form.sucursalIds.length > 0 ? form.sucursalIds : undefined,
      });
      setMostrarForm(false);
      setForm({ usuarioId: '', telefono: '', sucursalIds: [] });
      cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.message || 'Error al crear supervisor');
    } finally { setGuardando(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <HardHat className="w-7 h-7" style={{ color: 'var(--color-primary-400)' }} />
            Supervisores
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && supervisores.length === 0 ? 'Cargando...' : `${supervisores.length} supervisores registrados`}
          </p>
        </div>
        <button onClick={abrirForm}
          className="flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
          <Plus className="w-4 h-4" /> Nuevo Supervisor
        </button>
      </div>

      {/* Formulario crear */}
      {mostrarForm && (
        <div className="rounded-xl p-6 border animate-fade-in" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <h3 className="text-lg font-semibold mb-4">Registrar Supervisor</h3>
          {errorForm && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>{errorForm}</div>}

          {usuariosDisp.length === 0 ? (
            <div className="text-center py-6">
              <HardHat className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-texto-tenue)' }} />
              <p style={{ color: 'var(--color-texto-secundario)' }}>No hay usuarios con rol SUPERVISOR disponibles</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-texto-tenue)' }}>Todos los usuarios SUPERVISOR ya tienen perfil asignado</p>
            </div>
          ) : (
            <form onSubmit={manejarCrear} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                    Usuario <span style={{ color: 'var(--color-peligro-500)' }}>*</span>
                  </label>
                  <select value={form.usuarioId} onChange={e => setForm({ ...form, usuarioId: e.target.value })} required
                    className="w-full px-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
                    style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}>
                    <option value="">Seleccionar usuario...</option>
                    {usuariosDisp.map(u => (
                      <option key={u.id} value={u.id}>{u.nombreCompleto} ({u.correo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+52 81 1234 5678"
                    className="w-full px-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
                    style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
                </div>
              </div>

              {/* Sucursales como chips seleccionables */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-texto-secundario)' }}>
                  Sucursales Asignadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {sucursales.map(s => {
                    const selected = form.sucursalIds.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleSucursal(s.id)}
                        className="flex items-center gap-1.5 px-4 py-3 min-h-[48px] sm:min-h-auto sm:py-1.5 rounded-full text-sm font-medium transition-all border"
                        style={{
                          backgroundColor: selected ? 'var(--color-primary-600)' : 'transparent',
                          borderColor: selected ? 'var(--color-primary-600)' : 'var(--color-borde)',
                          color: selected ? 'white' : 'var(--color-texto-secundario)',
                        }}>
                        <MapPin className="w-3.5 h-3.5" />
                        {s.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button type="button" onClick={() => setMostrarForm(false)}
                  className="px-4 py-3 min-h-[48px] w-full sm:w-auto rounded-lg text-sm font-medium transition hover:bg-white/5" style={{ color: 'var(--color-texto-secundario)' }}>Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="px-5 py-3 min-h-[48px] w-full sm:w-auto rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}>
                  {guardando ? 'Guardando...' : 'Guardar Supervisor'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Búsqueda */}
      <div className="flex gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-texto-tenue)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg text-sm border outline-none transition focus:ring-2"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }} />
        </div>
      </div>

      {/* Grid Cards (Mobile) / Tabla (Desktop) */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-loader p-4 rounded-xl border flex flex-col gap-3 h-[180px]" />
          ))}
        </div>
      ) : supervisores.length === 0 ? (
        <div className="text-center py-16">
          <HardHat className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron supervisores</p>
        </div>
      ) : (
        <>
          {/* Vista Móvil (Tarjetas) */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {supervisores.map((sup) => (
              <div key={sup.id} className="p-4 rounded-xl border flex flex-col gap-3 transition-colors hover:bg-white/[0.04] cursor-pointer" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }} onClick={() => navigate(`/supervisores/${sup.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--color-primary-400)' }}>
                    {sup.usuario.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">{sup.usuario.nombreCompleto}</h3>
                    <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-texto-secundario)' }}>{sup.usuario.correo}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                </div>
                {sup.telefono && (
                  <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                    <Phone className="w-4 h-4" /> {sup.telefono}
                  </p>
                )}
                <div className="py-2.5 border-y flex flex-wrap gap-1.5" style={{ borderColor: 'var(--color-borde)' }}>
                  {sup.sucursales.length > 0 ? sup.sucursales.map(s => (
                    <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--color-primary-400)' }}>
                      <MapPin className="w-3.5 h-3.5" /> {s.sucursal.nombre.split(' - ')[0]}
                    </span>
                  )) : (
                    <span className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Sin sucursales asignadas</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--color-exito-500)' }}>
                    <ClipboardCheck className="w-4 h-4" /> {sup._count?.inspecciones || 0} Inspec.
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-medium" style={{ backgroundColor: (sup._count?.amonestaciones || 0) > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.1)', color: (sup._count?.amonestaciones || 0) > 0 ? 'var(--color-advertencia-500)' : 'var(--color-texto-tenue)' }}>
                    <AlertTriangle className="w-4 h-4" /> {sup._count?.amonestaciones || 0} Amon.
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Desktop (Tabla) */}
          <div className="hidden md:block rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--color-borde)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-fondo-card)' }}>
                  {['Supervisor', 'Correo', 'Teléfono', 'Sucursales', 'Inspecciones', 'Amonestaciones', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supervisores.map((sup) => (
                  <tr key={sup.id} className="border-t cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'var(--color-borde)' }}
                    onClick={() => navigate(`/supervisores/${sup.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--color-primary-400)' }}>
                          {sup.usuario.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium">{sup.usuario.nombreCompleto}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{sup.usuario.correo}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>
                      {sup.telefono ? (
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {sup.telefono}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sup.sucursales.length > 0 ? sup.sucursales.map(s => (
                          <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--color-primary-400)' }}>
                            <MapPin className="w-3 h-3" /> {s.sucursal.nombre.split(' - ')[0]}
                          </span>
                        )) : (
                          <span className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Sin asignar</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--color-exito-500)' }}>
                        <ClipboardCheck className="w-3 h-3" /> {sup._count?.inspecciones || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: (sup._count?.amonestaciones || 0) > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)',
                          color: (sup._count?.amonestaciones || 0) > 0 ? 'var(--color-advertencia-500)' : 'var(--color-texto-tenue)',
                        }}>
                        <AlertTriangle className="w-3 h-3" /> {sup._count?.amonestaciones || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
