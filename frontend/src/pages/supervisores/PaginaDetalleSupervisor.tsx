import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  supervisoresService,
  type SupervisorDetalle,
} from '../../services/supervisores.service';
import { sucursalesService, type Sucursal } from '../../services/trabajadores.service';
import {
  ArrowLeft, HardHat, MapPin, Phone, Mail,
  ClipboardCheck, AlertTriangle, Calendar,
  Edit3, Save, X, Building2,
} from 'lucide-react';

const SEVERIDAD_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  LEVE: { label: 'Leve', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)' },
  GRAVE: { label: 'Grave', color: 'var(--color-peligro-500)', bg: 'rgba(239,68,68,0.15)' },
  CRITICA: { label: 'Crítica', color: '#dc2626', bg: 'rgba(220,38,38,0.2)' },
};

const ESTADO_INSPECCION: Record<string, { label: string; color: string; bg: string }> = {
  EN_PROGRESO: { label: 'En Progreso', color: 'var(--color-primary-400)', bg: 'rgba(59,130,246,0.15)' },
  COMPLETADA: { label: 'Completada', color: 'var(--color-exito-500)', bg: 'rgba(34,197,94,0.15)' },
  CANCELADA: { label: 'Cancelada', color: 'var(--color-texto-tenue)', bg: 'rgba(100,116,139,0.15)' },
};

export default function PaginaDetalleSupervisor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supervisor, setSupervisor] = useState<SupervisorDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  // Edición de sucursales
  const [editandoSucursales, setEditandoSucursales] = useState(false);
  const [sucursalesDisp, setSucursalesDisp] = useState<Sucursal[]>([]);
  const [sucursalIdsEdit, setSucursalIdsEdit] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Edición de teléfono
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);

  // Desactivación
  const [desactivando, setDesactivando] = useState(false);

  const cargar = () => {
    if (!id) return;
    setCargando(true);
    supervisoresService.obtenerPorId(id)
      .then(setSupervisor)
      .catch(() => navigate('/supervisores'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [id]);

  const editarSucursales = async () => {
    setEditandoSucursales(true);
    try {
      const sucs = await sucursalesService.obtenerTodas();
      setSucursalesDisp(sucs);
      setSucursalIdsEdit(supervisor?.sucursales.map(s => s.sucursal.id) || []);
    } catch (err) { console.error(err); }
  };

  const guardarSucursales = async () => {
    if (!id) return;
    setGuardando(true);
    try {
      await supervisoresService.actualizar(id, { sucursalIds: sucursalIdsEdit });
      setEditandoSucursales(false);
      cargar();
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  };

  const toggleSucursalEdit = (sucId: string) => {
    setSucursalIdsEdit(prev =>
      prev.includes(sucId) ? prev.filter(s => s !== sucId) : [...prev, sucId]
    );
  };

  const iniciarEdicionTelefono = () => {
    setTelefonoEdit(supervisor?.telefono || '');
    setEditandoTelefono(true);
  };

  const guardarTelefono = async () => {
    if (!id) return;
    setGuardandoTelefono(true);
    try {
      await supervisoresService.actualizar(id, { telefono: telefonoEdit });
      setEditandoTelefono(false);
      cargar();
    } catch (err) { console.error(err); }
    finally { setGuardandoTelefono(false); }
  };

  const manejarDesactivar = async () => {
    if (!id || !supervisor?.usuario.activo) return;
    if (!window.confirm(`¿Estás seguro de desactivar al supervisor ${supervisor.usuario.nombreCompleto}?`)) return;
    
    setDesactivando(true);
    try {
      await supervisoresService.desactivar(id);
      cargar();
    } catch (err) { console.error(err); }
    finally { setDesactivando(false); }
  };

  if (cargando) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!supervisor) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/supervisores')} className="p-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--color-texto-secundario)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--color-primary-400)' }}>
            {supervisor.usuario.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {supervisor.usuario.nombreCompleto}
            </h1>
            <div className="flex items-center gap-4 text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {supervisor.usuario.correo}</span>
              {editandoTelefono ? (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> 
                  <input autoFocus value={telefonoEdit} onChange={e => setTelefonoEdit(e.target.value)}
                    className="px-2 py-0.5 text-sm rounded border outline-none bg-transparent"
                    style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                  />
                  <button onClick={guardarTelefono} disabled={guardandoTelefono} className="p-1 rounded hover:bg-white/10 text-green-500">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditandoTelefono(false)} className="p-1 rounded hover:bg-white/10 text-gray-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1 group">
                  <Phone className="w-3.5 h-3.5" /> {supervisor.telefono || 'Sin teléfono'}
                  <button onClick={iniciarEdicionTelefono} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity ml-1">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${supervisor.usuario.activo ? '' : 'opacity-50'}`}
            style={{
              backgroundColor: supervisor.usuario.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: supervisor.usuario.activo ? 'var(--color-exito-500)' : 'var(--color-peligro-500)',
            }}>
            {supervisor.usuario.activo ? 'Activo' : 'Inactivo'}
          </span>
          {supervisor.usuario.activo && (
            <button onClick={manejarDesactivar} disabled={desactivando}
              className="text-xs font-medium transition hover:underline disabled:opacity-50"
              style={{ color: 'var(--color-peligro-500)' }}>
              {desactivando ? 'Desactivando...' : 'Desactivar Supervisor'}
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Sucursales Asignadas</p>
          <p className="text-2xl font-bold">{supervisor.sucursales.length}</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Inspecciones Realizadas</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-exito-500)' }}>{supervisor._count?.inspecciones || 0}</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Amonestaciones Emitidas</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-advertencia-500)' }}>{supervisor._count?.amonestaciones || 0}</p>
        </div>
      </div>

      {/* Sucursales asignadas */}
      <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary-400)' }} />
            Sucursales Asignadas
          </h3>
          {!editandoSucursales ? (
            <button onClick={editarSucursales}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
              style={{ color: 'var(--color-primary-400)' }}>
              <Edit3 className="w-4 h-4" /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditandoSucursales(false)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={guardarSucursales} disabled={guardando}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}>
                <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {editandoSucursales ? (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {sucursalesDisp.map(s => {
              const selected = sucursalIdsEdit.includes(s.id);
              return (
                <button key={s.id} type="button" onClick={() => toggleSucursalEdit(s.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    backgroundColor: selected ? 'var(--color-primary-600)' : 'transparent',
                    borderColor: selected ? 'var(--color-primary-600)' : 'var(--color-borde)',
                    color: selected ? 'white' : 'var(--color-texto-secundario)',
                  }}>
                  <MapPin className="w-4 h-4" /> {s.nombre}
                </button>
              );
            })}
          </div>
        ) : supervisor.sucursales.length > 0 ? (
          <div className="space-y-2">
            {supervisor.sucursales.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                  <MapPin className="w-5 h-5" style={{ color: 'var(--color-primary-400)' }} />
                </div>
                <div>
                  <p className="font-medium text-sm">{s.sucursal.nombre}</p>
                  {s.sucursal.direccion && <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{s.sucursal.direccion}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-texto-tenue)' }} />
            <p style={{ color: 'var(--color-texto-secundario)' }}>Sin sucursales asignadas</p>
          </div>
        )}
      </div>

      {/* Actividad reciente — Inspecciones */}
      <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--color-exito-500)' }} />
          Inspecciones Recientes
        </h3>
        {supervisor.inspecciones.length > 0 ? (
          <div className="space-y-2">
            {supervisor.inspecciones.map(insp => {
              const badge = ESTADO_INSPECCION[insp.estado];
              return (
                <div key={insp.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: badge?.bg }}>
                      <ClipboardCheck className="w-5 h-5" style={{ color: badge?.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{insp.tipoTrabajo}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                        {insp.sucursal.nombre} • {new Date(insp.creadoEn).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                    {badge?.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-texto-tenue)' }} />
            <p style={{ color: 'var(--color-texto-secundario)' }}>Sin inspecciones registradas</p>
          </div>
        )}
      </div>

      {/* Actividad reciente — Amonestaciones */}
      <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-advertencia-500)' }} />
          Amonestaciones Recientes
        </h3>
        {supervisor.amonestaciones.length > 0 ? (
          <div className="space-y-2">
            {supervisor.amonestaciones.map(am => {
              const badge = SEVERIDAD_BADGE[am.severidad];
              return (
                <div key={am.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: badge?.bg }}>
                      <AlertTriangle className="w-5 h-5" style={{ color: badge?.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{am.motivo}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                        {am.trabajador.nombreCompleto} ({am.trabajador.dni}) • {am.sucursal.nombre}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(am.fechaEvento).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                    {badge?.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-texto-tenue)' }} />
            <p style={{ color: 'var(--color-texto-secundario)' }}>Sin amonestaciones registradas</p>
          </div>
        )}
      </div>

      {/* Info de cuenta */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
        <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
          Cuenta creada: {new Date(supervisor.usuario.creadoEn).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' • '}Perfil supervisor desde: {new Date(supervisor.creadoEn).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
