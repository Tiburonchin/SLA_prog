import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trabajadoresService, type Trabajador } from '../../services/trabajadores.service';
import {
  ArrowLeft, Heart, Shield, Package, GraduationCap,
  AlertTriangle, MapPin, Phone, User, Droplets,
  QrCode, Edit3, Save, X, Plus
} from 'lucide-react';

const ESTADO_SALUD: Record<string, { label: string; color: string; bg: string }> = {
  APTO: { label: 'Apto', color: 'var(--color-exito-500)', bg: 'rgba(34,197,94,0.15)' },
  NO_APTO: { label: 'No Apto', color: 'var(--color-peligro-500)', bg: 'rgba(239,68,68,0.15)' },
  APTO_CON_RESTRICCIONES: { label: 'Con Restricciones', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)' },
};

export default function PaginaDetalleTrabajador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<'info' | 'epp' | 'capacitaciones' | 'historial'>('info');
  const [mostrarQR, setMostrarQR] = useState(false);

  // Estados de edición
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [formEdit, setFormEdit] = useState<Partial<Trabajador>>({});

  // Modales EPP y Cap
  const [mostrarModalEpp, setMostrarModalEpp] = useState(false);
  const [formEpp, setFormEpp] = useState({ tipoEpp: '', marca: '', talla: '', fechaEntrega: new Date().toISOString().split('T')[0], fechaVencimiento: '', observaciones: '' });
  
  const [mostrarModalCap, setMostrarModalCap] = useState(false);
  const [formCap, setFormCap] = useState({ nombreCurso: '', institucion: '', fechaRealizacion: new Date().toISOString().split('T')[0], fechaVencimiento: '', certificadoUrl: '' });

  const cargar = () => {
    if (!id) return;
    setCargando(true);
    trabajadoresService.obtenerPorId(id)
      .then(data => {
        setTrabajador(data);
        setFormEdit(data);
      })
      .catch(() => navigate('/trabajadores'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [id]);

  const guardarCambios = async () => {
    if (!id) return;
    setGuardando(true);
    try {
      await trabajadoresService.actualizar(id, {
        tipoSangre: formEdit.tipoSangre,
        telefonoEmergencia: formEdit.telefonoEmergencia,
        contactoEmergencia: formEdit.contactoEmergencia,
        tallaCasco: formEdit.tallaCasco,
        tallaCamisa: formEdit.tallaCamisa,
        tallaPantalon: formEdit.tallaPantalon,
        tallaCalzado: formEdit.tallaCalzado,
        tallaGuantes: formEdit.tallaGuantes,
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
    if (!id || !trabajador?.activo) return;
    if (!window.confirm(`¿Estás seguro de desactivar al trabajador ${trabajador.nombreCompleto}?`)) return;
    
    setDesactivando(true);
    try {
      await trabajadoresService.desactivar(id);
      cargar();
    } catch (err) { console.error(err); }
    finally { setDesactivando(false); }
  };

  const manejarGuardarEpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await trabajadoresService.registrarEntregaEpp(id, formEpp);
      setMostrarModalEpp(false);
      setFormEpp({ tipoEpp: '', marca: '', talla: '', fechaEntrega: new Date().toISOString().split('T')[0], fechaVencimiento: '', observaciones: '' });
      cargar();
    } catch (e) { console.error(e); }
  };

  const manejarGuardarCap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await trabajadoresService.registrarCapacitacion(id, formCap);
      setMostrarModalCap(false);
      setFormCap({ nombreCurso: '', institucion: '', fechaRealizacion: new Date().toISOString().split('T')[0], fechaVencimiento: '', certificadoUrl: '' });
      cargar();
    } catch (e) { console.error(e); }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!trabajador) return null;

  const badge = ESTADO_SALUD[trabajador.estadoSalud];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/trabajadores')} className="p-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--color-texto-secundario)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {trabajador.nombreCompleto}
            {trabajador.codigoQr && (
              <button 
                onClick={() => setMostrarQR(true)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                title="Ver Código QR"
              >
                <QrCode className="w-5 h-5" style={{ color: 'var(--color-primary-400)' }} />
              </button>
            )}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
            {trabajador.cargo} • DNI: {trabajador.dni}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
            <Heart className="w-4 h-4" /> {badge?.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${trabajador.activo ? '' : 'opacity-50'}`}
            style={{
              backgroundColor: trabajador.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: trabajador.activo ? 'var(--color-exito-500)' : 'var(--color-peligro-500)',
            }}>
            {trabajador.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Datos principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 position-relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
           {!editando ? (
             <button onClick={() => setEditando(true)} className="p-1.5 bg-black/40 rounded hover:bg-black/60 text-white backdrop-blur-sm">
               <Edit3 className="w-4 h-4" />
             </button>
           ) : (
             <>
               <button onClick={guardarCambios} disabled={guardando} className="p-1.5 bg-green-500/80 rounded hover:bg-green-600/90 text-white backdrop-blur-sm">
                 <Save className="w-4 h-4" />
               </button>
               <button onClick={() => { setEditando(false); setFormEdit(trabajador); }} className="p-1.5 bg-red-500/80 rounded hover:bg-red-600/90 text-white backdrop-blur-sm">
                 <X className="w-4 h-4" />
               </button>
             </>
           )}
        </div>
        <InfoCard icono={<MapPin className="w-5 h-5" />} titulo="Sucursal" valor={trabajador.sucursal?.nombre || '—'} color="var(--color-primary-400)" />
        
        {editando ? (
          <>
            <div className="rounded-xl p-4 border flex flex-col justify-center" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-primary-500)' }}>
              <label className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Tipo Sangre</label>
              <input value={formEdit.tipoSangre || ''} onChange={e => setFormEdit({...formEdit, tipoSangre: e.target.value})} className="bg-transparent border-b border-gray-600 text-sm outline-none px-1" />
            </div>
            <div className="rounded-xl p-4 border flex flex-col justify-center" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-primary-500)' }}>
              <label className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>Teléfono Emergencia</label>
              <input value={formEdit.telefonoEmergencia || ''} onChange={e => setFormEdit({...formEdit, telefonoEmergencia: e.target.value})} className="bg-transparent border-b border-gray-600 text-sm outline-none px-1 mb-2" placeholder="Teléfono" />
              <input value={formEdit.contactoEmergencia || ''} onChange={e => setFormEdit({...formEdit, contactoEmergencia: e.target.value})} className="bg-transparent border-b border-gray-600 text-sm outline-none px-1" placeholder="Nombre Contacto" />
            </div>
          </>
        ) : (
          <>
            <InfoCard icono={<Droplets className="w-5 h-5" />} titulo="Tipo Sangre" valor={trabajador.tipoSangre || '—'} color="var(--color-peligro-400)" />
            <InfoCard icono={<Phone className="w-5 h-5" />} titulo="Emergencia" valor={trabajador.telefonoEmergencia || '—'} subtitulo={trabajador.contactoEmergencia} color="var(--color-advertencia-400)" />
          </>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--color-fondo-card)' }}>
        {[
          { key: 'info', label: 'Tallas EPP', icono: <User className="w-4 h-4" /> },
          { key: 'epp', label: `Entregas (${trabajador.entregasEpp?.length || 0})`, icono: <Package className="w-4 h-4" /> },
          { key: 'capacitaciones', label: `Capacitaciones (${trabajador.capacitaciones?.length || 0})`, icono: <GraduationCap className="w-4 h-4" /> },
          { key: 'historial', label: `Amonestaciones (${trabajador.amonestaciones?.length || 0})`, icono: <AlertTriangle className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPestana(tab.key as any)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex-1 justify-center"
            style={{
              backgroundColor: pestana === tab.key ? 'var(--color-primary-600)' : 'transparent',
              color: pestana === tab.key ? 'white' : 'var(--color-texto-secundario)',
            }}
          >
            {tab.icono} {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido por pestaña */}
      <div className="rounded-xl border p-6 animate-fade-in" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
        {pestana === 'info' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative group">
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
               {!editando ? (
                 <button onClick={() => setEditando(true)} className="p-1.5 bg-black/40 rounded hover:bg-black/60 text-white backdrop-blur-sm">
                   <Edit3 className="w-4 h-4" />
                 </button>
               ) : (
                  <button onClick={guardarCambios} disabled={guardando} className="p-1.5 bg-green-500/80 rounded hover:bg-green-600/90 text-white backdrop-blur-sm">
                    <Save className="w-4 h-4" />
                  </button>
               )}
            </div>
            {[
              { key: 'tallaCasco', label: 'Casco', valor: trabajador.tallaCasco },
              { key: 'tallaCamisa', label: 'Camisa', valor: trabajador.tallaCamisa },
              { key: 'tallaPantalon', label: 'Pantalón', valor: trabajador.tallaPantalon },
              { key: 'tallaCalzado', label: 'Calzado', valor: trabajador.tallaCalzado },
              { key: 'tallaGuantes', label: 'Guantes', valor: trabajador.tallaGuantes },
            ].map(t => (
              <div key={t.label} className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--color-texto-tenue)' }}>{t.label}</p>
                {editando ? (
                  <input 
                    value={(formEdit as any)[t.key] || ''} 
                    onChange={e => setFormEdit({...formEdit, [t.key]: e.target.value})}
                    className="w-full text-center bg-transparent border-b text-sm font-bold outline-none"
                    style={{ borderColor: 'var(--color-primary-500)' }}
                  />
                ) : (
                  <p className="text-lg font-bold">{t.valor || '—'}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {pestana === 'epp' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Historial de Entregas</h3>
              <button onClick={() => setMostrarModalEpp(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Registrar EPP
              </button>
            </div>
            {trabajador.entregasEpp?.length ? (
              <div className="space-y-3">
                {trabajador.entregasEpp.map((epp: any) => (
                  <div key={epp.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-blue-500/20 transition-colors" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                    <div>
                      <p className="font-medium">{epp.tipoEpp}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                        {epp.marca && `${epp.marca} •`} Talla: {epp.talla || '—'}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p style={{ color: 'var(--color-texto-secundario)' }}>{new Date(epp.fechaEntrega).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</p>
                      {epp.fechaVencimiento && (
                        <p className="text-xs font-medium mt-1" style={{ color: new Date(epp.fechaVencimiento) < new Date() ? 'var(--color-peligro-500)' : 'var(--color-exito-500)' }}>
                          {new Date(epp.fechaVencimiento) < new Date() ? '⚠ Vencido' : `Vence: ${new Date(epp.fechaVencimiento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState texto="Sin entregas de EPP registradas" />}
          </div>
        )}

        {pestana === 'capacitaciones' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Historial Analítico</h3>
              <button onClick={() => setMostrarModalCap(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Nueva Capacitación
              </button>
            </div>
            {trabajador.capacitaciones?.length ? (
              <div className="space-y-3">
                {trabajador.capacitaciones.map((cap: any) => (
                  <div key={cap.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-green-500/20 transition-colors" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                    <div>
                      <p className="font-medium">{cap.nombreCurso}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{cap.institucion || 'Sin institución'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p style={{ color: 'var(--color-texto-secundario)' }}>{new Date(cap.fechaRealizacion).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1" style={{
                        backgroundColor: cap.vigente && (!cap.fechaVencimiento || new Date(cap.fechaVencimiento) > new Date()) ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: cap.vigente && (!cap.fechaVencimiento || new Date(cap.fechaVencimiento) > new Date()) ? 'var(--color-exito-500)' : 'var(--color-peligro-500)',
                      }}>
                        {cap.vigente && (!cap.fechaVencimiento || new Date(cap.fechaVencimiento) > new Date()) ? 'Vigente' : 'Expirada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState texto="Sin capacitaciones registradas" />}
          </div>
        )}

        {pestana === 'historial' && (
          trabajador.amonestaciones?.length ? (
            <div className="space-y-3">
              {trabajador.amonestaciones.map((am: any) => (
                <div key={am.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{am.motivo}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                      backgroundColor: am.severidad === 'CRITICA' ? 'rgba(239,68,68,0.15)' : am.severidad === 'GRAVE' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                      color: am.severidad === 'CRITICA' ? 'var(--color-peligro-500)' : am.severidad === 'GRAVE' ? 'var(--color-advertencia-500)' : 'var(--color-primary-400)',
                    }}>
                      {am.severidad}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>{am.descripcion}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-texto-tenue)' }}>
                    {new Date(am.fechaEvento).toLocaleDateString('es-MX')} • {am.supervisor?.usuario?.nombreCompleto || 'Supervisor'}
                  </p>
                </div>
              ))}
            </div>
          ) : <EmptyState texto="Sin amonestaciones registradas" />
        )}
      </div>

      {/* Info Account & Desactivar */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs px-4" style={{ color: 'var(--color-texto-tenue)' }}>
          Registro creado: {new Date(trabajador.creadoEn).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {trabajador.activo && (
          <button onClick={manejarDesactivar} disabled={desactivando}
            className="text-xs font-medium transition hover:underline disabled:opacity-50 px-4"
            style={{ color: 'var(--color-peligro-500)' }}>
            {desactivando ? 'Desactivando...' : 'Desactivar Trabajador'}
          </button>
        )}
      </div>

      {/* Modal QR */}
      {mostrarQR && trabajador.codigoQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setMostrarQR(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setMostrarQR(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{trabajador.nombreCompleto}</h3>
            <p className="text-gray-500 text-sm mb-6">{trabajador.cargo} • DNI: {trabajador.dni}</p>
            
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex justify-center mb-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trabajador.codigoQr)}&margin=10`}
                alt={`QR Code ${trabajador.nombreCompleto}`}
                className="rounded-lg shadow-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 break-all font-mono">ID: {trabajador.codigoQr}</p>
          </div>
        </div>
      )}

      {/* Modal EPP */}
      {mostrarModalEpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-borde)' }}>
              <h3 className="font-bold text-lg">Registrar Entrega EPP</h3>
              <button onClick={() => setMostrarModalEpp(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5"/></button>
            </div>
            <form id="form-epp" onSubmit={manejarGuardarEpp} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Equipo <span className="text-red-500">*</span></label>
                <input required value={formEpp.tipoEpp} onChange={e => setFormEpp({...formEpp, tipoEpp: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-blue-500" style={{borderColor: 'var(--color-borde)'}} placeholder="Ej: Casco dieléctrico" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <input value={formEpp.marca} onChange={e => setFormEpp({...formEpp, marca: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-blue-500" style={{borderColor: 'var(--color-borde)'}} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Talla</label>
                  <input value={formEpp.talla} onChange={e => setFormEpp({...formEpp, talla: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-blue-500" style={{borderColor: 'var(--color-borde)'}} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Entrega <span className="text-red-500">*</span></label>
                  <input required type="date" value={formEpp.fechaEntrega} onChange={e => setFormEpp({...formEpp, fechaEntrega: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-blue-500" style={{borderColor: 'var(--color-borde)'}} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimiento</label>
                  <input type="date" value={formEpp.fechaVencimiento} onChange={e => setFormEpp({...formEpp, fechaVencimiento: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-blue-500" style={{borderColor: 'var(--color-borde)'}} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea rows={2} value={formEpp.observaciones} onChange={e => setFormEpp({...formEpp, observaciones: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-blue-500 resize-none" style={{borderColor: 'var(--color-borde)'}} />
              </div>
            </form>
            <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-borde)' }}>
              <button type="button" onClick={() => setMostrarModalEpp(false)} className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition">Cancelar</button>
              <button form="form-epp" type="submit" className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Capacitaciones */}
      {mostrarModalCap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-borde)' }}>
              <h3 className="font-bold text-lg">Nueva Capacitación</h3>
              <button onClick={() => setMostrarModalCap(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5"/></button>
            </div>
            <form id="form-cap" onSubmit={manejarGuardarCap} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Curso <span className="text-red-500">*</span></label>
                <input required value={formCap.nombreCurso} onChange={e => setFormCap({...formCap, nombreCurso: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-green-500" style={{borderColor: 'var(--color-borde)'}} placeholder="Ej: Alturas nivel avanzado" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Institución</label>
                <input value={formCap.institucion} onChange={e => setFormCap({...formCap, institucion: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-green-500" style={{borderColor: 'var(--color-borde)'}} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Realización <span className="text-red-500">*</span></label>
                  <input required type="date" value={formCap.fechaRealizacion} onChange={e => setFormCap({...formCap, fechaRealizacion: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-green-500" style={{borderColor: 'var(--color-borde)'}} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimiento</label>
                  <input type="date" value={formCap.fechaVencimiento} onChange={e => setFormCap({...formCap, fechaVencimiento: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-green-500" style={{borderColor: 'var(--color-borde)'}} />
                </div>
              </div>
            </form>
            <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-borde)' }}>
              <button type="button" onClick={() => setMostrarModalCap(false)} className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition">Cancelar</button>
              <button form="form-cap" type="submit" className="px-5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icono, titulo, valor, subtitulo, color }: { icono: React.ReactNode; titulo: string; valor: string; subtitulo?: string; color: string }) {
  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icono}</span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-texto-tenue)' }}>{titulo}</span>
      </div>
      <p className="font-semibold">{valor}</p>
      {subtitulo && <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{subtitulo}</p>}
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="text-center py-8">
      <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-texto-tenue)' }} />
      <p style={{ color: 'var(--color-texto-secundario)' }}>{texto}</p>
    </div>
  );
}
