import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trabajadoresService, sucursalesService, type Trabajador, type Sucursal } from '../../services/trabajadores.service';
import { Users, Plus, Search, Filter, ChevronRight, Heart } from 'lucide-react';

const ESTADO_SALUD_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  APTO: { label: 'Apto', color: 'var(--color-exito-500)', bg: 'rgba(34, 197, 94, 0.15)' },
  NO_APTO: { label: 'No Apto', color: 'var(--color-peligro-500)', bg: 'rgba(239, 68, 68, 0.15)' },
  APTO_CON_RESTRICCIONES: { label: 'Con Restricciones', color: 'var(--color-advertencia-500)', bg: 'rgba(245, 158, 11, 0.15)' },
};

export default function PaginaTrabajadores() {
  const navigate = useNavigate();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Form state
  const [form, setForm] = useState({
    dni: '', nombreCompleto: '', cargo: '', sucursalId: '',
    tipoSangre: '', telefonoEmergencia: '', contactoEmergencia: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [trabs, sucs] = await Promise.all([
        trabajadoresService.obtenerTodos(busqueda || undefined, filtroSucursal || undefined),
        sucursalesService.obtenerTodas(),
      ]);
      setTrabajadores(trabs.datos);
      setSucursales(sucs);
    } catch (err) {
      console.error('Error cargando trabajadores:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroSucursal]);

  // Buscar con debounce manual
  useEffect(() => {
    const timeout = setTimeout(() => cargarDatos(), 400);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      await trabajadoresService.crear({
        ...form,
        tipoSangre: form.tipoSangre || undefined,
        telefonoEmergencia: form.telefonoEmergencia || undefined,
        contactoEmergencia: form.contactoEmergencia || undefined,
      });
      setMostrarFormulario(false);
      setForm({ dni: '', nombreCompleto: '', cargo: '', sucursalId: '', tipoSangre: '', telefonoEmergencia: '', contactoEmergencia: '' });
      cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.message || 'Error al crear trabajador');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7" style={{ color: 'var(--color-primary-400)' }} />
            Trabajadores
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            {cargando && trabajadores.length === 0 ? 'Cargando...' : `${trabajadores.length} trabajadores activos`}
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Trabajador
        </button>
      </div>

      {/* Formulario de creación */}
      {mostrarFormulario && (
        <div
          className="rounded-xl p-6 border animate-fade-in"
          style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}
        >
          <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Trabajador</h3>
          {errorForm && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}>
              {errorForm}
            </div>
          )}
          <form onSubmit={manejarCrear} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'dni', label: 'DNI / Identificación', required: true },
              { key: 'nombreCompleto', label: 'Nombre Completo', required: true },
              { key: 'cargo', label: 'Cargo / Puesto', required: true },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  {field.label} {field.required && <span style={{ color: 'var(--color-peligro-500)' }}>*</span>}
                </label>
                <input
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.required}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2"
                  style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                Sucursal <span style={{ color: 'var(--color-peligro-500)' }}>*</span>
              </label>
              <select
                value={form.sucursalId}
                onChange={e => setForm({ ...form, sucursalId: e.target.value })}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2"
                style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
              >
                <option value="">Seleccionar sucursal...</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            {[
              { key: 'tipoSangre', label: 'Tipo de Sangre' },
              { key: 'telefonoEmergencia', label: 'Teléfono Emergencia' },
              { key: 'contactoEmergencia', label: 'Contacto Emergencia' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>{field.label}</label>
                <input
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2"
                  style={{ backgroundColor: 'var(--color-fondo-input)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
                />
              </div>
            ))}

            <div className="col-span-full flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/5"
                style={{ color: 'var(--color-texto-secundario)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), var(--color-exito-700))' }}
              >
                {guardando ? 'Guardando...' : 'Guardar Trabajador'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DNI o cargo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-2"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-tenue)' }} />
          <select
            value={filtroSucursal}
            onChange={e => setFiltroSucursal(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg text-sm border outline-none appearance-none transition"
            style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
        </div>
      ) : trabajadores.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-texto-tenue)' }} />
          <p style={{ color: 'var(--color-texto-secundario)' }}>No se encontraron trabajadores</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-borde)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-fondo-card)' }}>
                {['Nombre', 'DNI', 'Cargo', 'Sucursal', 'Estado Salud', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trabajadores.map((t, i) => {
                const badge = ESTADO_SALUD_BADGE[t.estadoSalud];
                return (
                  <tr
                    key={t.id}
                    className="border-t cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'var(--color-borde)', animationDelay: `${i * 30}ms` }}
                    onClick={() => navigate(`/trabajadores/${t.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{t.nombreCompleto}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{t.dni}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{t.cargo}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{t.sucursal?.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                        <Heart className="w-3 h-3" /> {badge?.label}
                      </span>
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
    </div>
  );
}
