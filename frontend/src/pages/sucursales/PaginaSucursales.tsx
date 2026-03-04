import { useState, useEffect } from 'react';
import { Building2, Search, Plus, MoreVertical, Edit2, Trash2, MapPin } from 'lucide-react';
import { sucursalesService } from '../../services/trabajadores.service';
import type { Sucursal, CrearSucursalData } from '../../services/trabajadores.service';

export default function PaginaSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal de crear/editar
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CrearSucursalData>({
    nombre: '',
    direccion: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargarSucursales = async () => {
    setCargando(true);
    try {
      const data = await sucursalesService.obtenerTodas();
      setSucursales(data);
    } catch (err) {
      console.error('Error al cargar sucursales:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const sucursalesFiltradas = sucursales.filter(s => 
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (s.direccion && s.direccion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({ nombre: '', direccion: '' });
    setError('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (sucursal: Sucursal) => {
    setEditandoId(sucursal.id);
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      latitud: sucursal.latitud,
      longitud: sucursal.longitud,
    });
    setError('');
    setMostrarModal(true);
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError('');
    setGuardando(true);

    try {
      if (editandoId) {
        await sucursalesService.actualizar(editandoId, formData);
      } else {
        await sucursalesService.crear(formData);
      }
      setMostrarModal(false);
      cargarSucursales();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la sucursal');
    } finally {
      setGuardando(false);
    }
  };

  const manejarDesactivar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar la sucursal "${nombre}"?`)) return;
    try {
      await sucursalesService.desactivar(id);
      cargarSucursales();
    } catch (err) {
      console.error('Error al desactivar:', err);
      alert('No se pudo desactivar la sucursal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sucursales</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            Gestiona las sedes y ubicaciones de la empresa
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          <Plus className="w-5 h-5" />
          Nueva Sucursal
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-transparent outline-none transition-shadow"
          style={{
            borderColor: 'var(--color-borde)',
            color: 'var(--color-texto-principal)',
          }}
        />
      </div>

      {/* Lista */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-card)' }}>
        {cargando ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-texto-secundario)' }}>
            <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--color-primary-500)' }}></div>
            Cargando sucursales...
          </div>
        ) : sucursalesFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">No se encontraron sucursales</h3>
            <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
              {busqueda ? "Intenta con otros términos de búsqueda" : "No hay sucursales registradas en el sistema"}
            </p>
            {!busqueda && (
              <button
                onClick={abrirModalCrear}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Crear primera sucursal
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-sm" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-tenue)' }}>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Dirección</th>
                  <th className="px-6 py-4 font-medium text-center">Trabajadores</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {sucursalesFiltradas.map((sucursal) => (
                  <tr key={sucursal.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        {sucursal.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-texto-secundario)' }}>
                      {sucursal.direccion ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 opacity-50" />
                          {sucursal.direccion}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500">
                        {sucursal._count?.trabajadores || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => abrirModalEditar(sucursal)}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => manejarDesactivar(sucursal.id, sucursal.nombre)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => !guardando && setMostrarModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-borde)' }}>
              <h2 className="text-xl font-bold">{editandoId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
              <button onClick={() => !guardando && setMostrarModal(false)} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                ✕
              </button>
            </div>
            
            <form onSubmit={manejarSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ borderColor: 'var(--color-borde)' }}
                  placeholder="Ej. Planta Monterrey"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  Dirección
                </label>
                <textarea
                  value={formData.direccion || ''}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ borderColor: 'var(--color-borde)', minHeight: '80px' }}
                  placeholder="Dirección completa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Latitud</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitud || ''}
                    onChange={e => setFormData({ ...formData, latitud: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    style={{ borderColor: 'var(--color-borde)' }}
                    placeholder="Ej. 25.6866"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-texto-secundario)' }}>Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitud || ''}
                    onChange={e => setFormData({ ...formData, longitud: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    style={{ borderColor: 'var(--color-borde)' }}
                    placeholder="Ej. -100.316"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t mt-6" style={{ borderColor: 'var(--color-borde)' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-lg font-medium border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--color-borde)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-lg font-medium text-white transition-opacity disabled:opacity-70"
                  style={{ backgroundColor: 'var(--color-primary-500)' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
