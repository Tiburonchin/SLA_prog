import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { trabajadoresService, type Trabajador } from '../../services/trabajadores.service';
import { amonestacionesService, type CrearAmonestacionData } from '../../services/amonestaciones.service';
import { useAmonestacionesOfflineStore } from '../../stores/amonestaciones-offline.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  ArrowLeft, Heart, Shield, Package, GraduationCap,
  AlertTriangle, MapPin, Phone, User, Droplets,
  QrCode, Edit3, Save, X, Plus, Building2, Calendar,
  ExternalLink, Camera, ClipboardCheck, Stethoscope, ShieldCheck,
  Briefcase, Mail, FileText
} from 'lucide-react';

const calcularAnios = (fecha?: string) => {
  if (!fecha) return null;
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const ESTADO_SALUD: Record<string, { label: string; color: string; bg: string }> = {
  APTO: { label: 'Apto', color: 'var(--color-exito-500)', bg: 'rgba(34,197,94,0.15)' },
  NO_APTO: { label: 'No Apto', color: 'var(--color-peligro-500)', bg: 'rgba(239,68,68,0.15)' },
  APTO_CON_RESTRICCIONES: { label: 'Con Restricciones', color: 'var(--color-advertencia-500)', bg: 'rgba(245,158,11,0.15)' },
};

/* ─── Helper para comprimir imagen ─── */
function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/* ─── Modal genérico con portal ─── */
function ModalPortal({ abierto, children, onCerrar }: { abierto: boolean; children: React.ReactNode; onCerrar: () => void }) {
  if (!abierto) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="absolute inset-0 bg-black/65" />
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function PaginaDetalleTrabajador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<'info' | 'epp' | 'capacitaciones' | 'historial' | 'inspecciones'>('info');
  const [mostrarQR, setMostrarQR] = useState(false);
  const [mostrarMasInfo, setMostrarMasInfo] = useState(false);

  // Edit state
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [formEdit, setFormEdit] = useState<Partial<Trabajador & { fotoBase64: string }>>({});

  // Modals
  const [mostrarModalEpp, setMostrarModalEpp] = useState(false);
  const [formEpp, setFormEpp] = useState({ tipoEpp: '', marca: '', talla: '', fechaEntrega: new Date().toISOString().split('T')[0], fechaVencimiento: '', observaciones: '' });
  const [mostrarModalCap, setMostrarModalCap] = useState(false);
  const [formCap, setFormCap] = useState({ nombreCurso: '', institucion: '', fechaRealizacion: new Date().toISOString().split('T')[0], fechaVencimiento: '', certificadoUrl: '' });
  const [mostrarModalAmon, setMostrarModalAmon] = useState(false);
  const [formAmon, setFormAmon] = useState({ motivo: '', severidad: 'LEVE' as 'LEVE' | 'GRAVE' | 'CRITICA', descripcion: '', testimonios: '' });
  const usuario = useAuthStore(s => s.usuario);
  const amonestacionesOffline = useAmonestacionesOfflineStore();

  const manejarCambioFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await comprimirImagen(file);
      setFormEdit(prev => ({ ...prev, fotoBase64: compressed }));
    } catch (err) {
      console.error('Error al procesar la imagen', err);
    }
  };

  const cargar = () => {
    if (!id) return;
    setCargando(true);
    trabajadoresService.obtenerPorId(id)
      .then(data => { setTrabajador(data); setFormEdit(data); })
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
        fotoBase64: formEdit.fotoBase64,
        alergias: formEdit.alergias,
        condicionesPreexistentes: formEdit.condicionesPreexistentes,
        eps: formEdit.eps,
        arl: formEdit.arl,
        fechaUltimoExamen: formEdit.fechaUltimoExamen ? String(formEdit.fechaUltimoExamen).split('T')[0] : undefined,
        curp: formEdit.curp,
        nss: formEdit.nss,
        telefono: formEdit.telefono,
        correo: formEdit.correo,
        turno: formEdit.turno,
        nivelEducativo: formEdit.nivelEducativo,
        fechaIngreso: formEdit.fechaIngreso ? String(formEdit.fechaIngreso).split('T')[0] : undefined,
        fechaNacimiento: formEdit.fechaNacimiento ? String(formEdit.fechaNacimiento).split('T')[0] : undefined,
      });
      setEditando(false);
      cargar();
    } catch (err) { console.error('Error al actualizar', err); }
    finally { setGuardando(false); }
  };

  const manejarDesactivar = async () => {
    if (!id || !trabajador?.activo) return;
    if (!window.confirm(`¿Desactivar al trabajador ${trabajador.nombreCompleto}?`)) return;
    setDesactivando(true);
    try { await trabajadoresService.desactivar(id); cargar(); }
    catch (err) { console.error(err); }
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

  const manejarGuardarAmon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !trabajador) return;

    const nuevaAmonestacion = {
      trabajadorId: id,
      supervisorId: usuario?.id || '',
      sucursalId: trabajador.sucursalId,
      motivo: formAmon.motivo,
      severidad: formAmon.severidad,
      descripcion: formAmon.descripcion,
      testimonios: formAmon.testimonios || undefined,
      fechaEvento: new Date().toISOString(),
    };

    try {
      if (!navigator.onLine) {
        throw new Error('Sin conexión');
      }
      await amonestacionesService.crear(nuevaAmonestacion);
    } catch (e: any) {
      console.warn("Fallo de red al registrar amonestación. Guardando offline.");
      amonestacionesOffline.guardarOffline(nuevaAmonestacion);
      alert('Amonestación guardada localmente de forma offline. Se sincronizará automáticamente cuando recupere la conexión.');
    } finally {
      setMostrarModalAmon(false);
      setFormAmon({ motivo: '', severidad: 'LEVE', descripcion: '', testimonios: '' });
      cargar();
    }
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
  const initials = trabajador.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Back button ── */}
      <button onClick={() => navigate('/trabajadores')} className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: 'var(--color-texto-secundario)' }}>
        <ArrowLeft className="w-4 h-4" /> Volver a Trabajadores
      </button>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Profile Card */}
        <div className="lg:w-[320px] shrink-0 space-y-4">
          
          

          <div className="rounded-xl border p-6 space-y-5" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
            {/* Avatar + Name */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3 group">
                {editando && (
                  <input type="file" accept="image/*" onChange={manejarCambioFoto} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Cambiar foto de perfil" />
                )}
                <div 
                  className={`w-full h-full rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden border-4 transition-all ${editando ? 'border-dashed border-blue-400/50 group-hover:border-blue-400' : 'border-transparent'}`} 
                  style={{ background: formEdit.fotoBase64 || trabajador.fotoUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))', color: 'white' }}
                >
                  {formEdit.fotoBase64 || trabajador.fotoUrl ? (
                    <img src={formEdit.fotoBase64 || trabajador.fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {editando && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center pointer-events-none transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold">{trabajador.nombreCompleto}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>{trabajador.cargo}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: badge?.bg, color: badge?.color }}>
                <Heart className="w-3.5 h-3.5" /> {badge?.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: trabajador.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: trabajador.activo ? 'var(--color-exito-500)' : 'var(--color-peligro-500)' }}>
                {trabajador.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Key info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 py-2 border-t" style={{ borderColor: 'var(--color-borde)' }}>
                <User className="w-4 h-4 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>DNI</p>
                  <p className="font-semibold">{trabajador.dni}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Sucursal</p>
                  <p className="font-semibold">{trabajador.sucursal?.nombre || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="w-4 h-4 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Tipo Sangre</p>
                  {editando ? (
                    <input value={formEdit.tipoSangre || ''} onChange={e => setFormEdit({ ...formEdit, tipoSangre: e.target.value })} className="w-full bg-transparent border-b outline-none text-sm font-semibold focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} placeholder="O+" />
                  ) : (
                    <p className="font-semibold">{trabajador.tipoSangre || '—'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Emergencia</p>
                  {editando ? (
                    <div className="space-y-1">
                      <input value={formEdit.telefonoEmergencia || ''} onChange={e => setFormEdit({ ...formEdit, telefonoEmergencia: e.target.value })} className="w-full bg-transparent border-b outline-none text-sm font-semibold focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} placeholder="555-1234" />
                      <input value={formEdit.contactoEmergencia || ''} onChange={e => setFormEdit({ ...formEdit, contactoEmergencia: e.target.value })} className="w-full bg-transparent border-b outline-none text-xs focus:border-blue-500" style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)' }} placeholder="Nombre contacto" />
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold">{trabajador.telefonoEmergencia || '—'}</p>
                      {trabajador.contactoEmergencia && <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{trabajador.contactoEmergencia}</p>}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--color-texto-tenue)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Registrado</p>
                  <p className="font-semibold">{new Date(trabajador.creadoEn).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* ── Toggle Detalles ── */}
            {!editando && (
              <button
                onClick={() => setMostrarMasInfo(!mostrarMasInfo)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-secundario)', marginTop: '1rem' }}
              >
                {mostrarMasInfo ? 'Ocultar detalles avanzados' : 'Ver todos los detalles...'}
              </button>
            )}

            {(mostrarMasInfo || editando) && (
              <>
                {/* ── Info Auxiliar ── */}
                <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-borde)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-texto-tenue)' }}>
                    <Briefcase className="w-3.5 h-3.5" /> Laboral & Personal
                  </h4>
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    <div className="p-2 rounded-lg bg-black/10 text-center">
                      <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-texto-tenue)' }}>Antigüedad</p>
                      <p className="text-sm font-semibold text-blue-400">
                        {trabajador.fechaIngreso ? `${calcularAnios(trabajador.fechaIngreso)} años` : '—'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-black/10 text-center">
                      <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-texto-tenue)' }}>Edad</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        {trabajador.fechaNacimiento ? `${calcularAnios(trabajador.fechaNacimiento)} años` : '—'}
                      </p>
                    </div>
                  </div>

                  {[
                    { key: 'turno', label: 'Turno', valor: trabajador.turno, icono: <Calendar className="w-3 h-3"/> },
                    { key: 'telefono', label: 'Móvil', valor: trabajador.telefono, icono: <Phone className="w-3 h-3"/> },
                    { key: 'correo', label: 'Email', valor: trabajador.correo, icono: <Mail className="w-3 h-3"/> },
                    { key: 'curp', label: 'CURP', valor: trabajador.curp, icono: <FileText className="w-3 h-3"/> },
                    { key: 'nss', label: 'NSS', valor: trabajador.nss, icono: <ShieldCheck className="w-3 h-3"/> },
                    { key: 'nivelEducativo', label: 'Educación', valor: trabajador.nivelEducativo, icono: <GraduationCap className="w-3 h-3"/> },
                  ].map(item => (
                    <div key={item.key} className="flex items-start gap-2">
                      <div className="mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{item.icono}</div>
                      <p className="text-xs w-16 shrink-0 pt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{item.label}</p>
                      {editando ? (
                        <input value={(formEdit as any)[item.key] || ''} onChange={e => setFormEdit({ ...formEdit, [item.key]: e.target.value })} className="flex-1 bg-transparent border-b text-xs outline-none focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} placeholder={`Sin ${item.label.toLowerCase()}`} />
                      ) : (
                        <p className="text-[13px] font-medium break-all">{item.valor || '—'}</p>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}><Briefcase className="w-3 h-3"/></div>
                    <p className="text-xs w-16 shrink-0 pt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>Ingreso</p>
                    {editando ? (
                      <input type="date" value={formEdit.fechaIngreso ? String(formEdit.fechaIngreso).split('T')[0] : ''} onChange={e => setFormEdit({ ...formEdit, fechaIngreso: e.target.value })} className="flex-1 bg-transparent border-b text-xs outline-none focus:border-blue-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
                    ) : (
                      <p className="text-[13px] font-medium">{trabajador.fechaIngreso ? new Date(trabajador.fechaIngreso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}><User className="w-3 h-3"/></div>
                    <p className="text-xs w-16 shrink-0 pt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>Nacimiento</p>
                    {editando ? (
                      <input type="date" value={formEdit.fechaNacimiento ? String(formEdit.fechaNacimiento).split('T')[0] : ''} onChange={e => setFormEdit({ ...formEdit, fechaNacimiento: e.target.value })} className="flex-1 bg-transparent border-b text-xs outline-none focus:border-blue-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
                    ) : (
                      <p className="text-[13px] font-medium">{trabajador.fechaNacimiento ? new Date(trabajador.fechaNacimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    )}
                  </div>
                </div>

                {/* ── Medical Info ── */}
                <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-borde)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-texto-tenue)' }}>
                    <Stethoscope className="w-3.5 h-3.5" /> Información Médica
                  </h4>
                  {[
                    { key: 'eps', label: 'EPS', valor: trabajador.eps },
                    { key: 'arl', label: 'ARL', valor: trabajador.arl },
                    { key: 'alergias', label: 'Alergias', valor: trabajador.alergias },
                    { key: 'condicionesPreexistentes', label: 'Condiciones', valor: trabajador.condicionesPreexistentes },
                  ].map(item => (
                    <div key={item.key} className="flex items-start gap-3">
                      <p className="text-xs w-20 shrink-0 pt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{item.label}</p>
                      {editando ? (
                        <input value={(formEdit as any)[item.key] || ''} onChange={e => setFormEdit({ ...formEdit, [item.key]: e.target.value })} className="flex-1 bg-transparent border-b text-sm outline-none focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} placeholder={`Sin ${item.label.toLowerCase()}`} />
                      ) : (
                        <p className="text-sm font-medium">{item.valor || '—'}</p>
                      )}
                    </div>
                  ))}
                  <div className="flex items-start gap-3">
                    <p className="text-xs w-20 shrink-0 pt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>Examen</p>
                    {editando ? (
                      <input type="date" value={formEdit.fechaUltimoExamen ? String(formEdit.fechaUltimoExamen).split('T')[0] : ''} onChange={e => setFormEdit({ ...formEdit, fechaUltimoExamen: e.target.value })} className="flex-1 bg-transparent border-b text-sm outline-none focus:border-blue-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
                    ) : (
                      <p className="text-sm font-medium">{trabajador.fechaUltimoExamen ? new Date(trabajador.fechaUltimoExamen).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-borde)' }}>
              {!editando ? (
                <button onClick={() => setEditando(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/5 border" style={{ borderColor: 'var(--color-borde)' }}>
                  <Edit3 className="w-4 h-4 text-blue-400" /> Editar Datos
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={guardarCambios} disabled={guardando} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #16a34a)' }}>
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                  <button onClick={() => { setEditando(false); setFormEdit(trabajador); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border hover:bg-white/5" style={{ borderColor: 'var(--color-borde)' }}>
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              )}

              {trabajador.codigoQr && (
                <button onClick={() => setMostrarQR(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition hover:bg-blue-500/10 text-blue-400 border" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
                  <QrCode className="w-4 h-4" /> Ver Código QR
                </button>
              )}


              {trabajador.activo && (
                <button onClick={manejarDesactivar} disabled={desactivando} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition hover:bg-red-500/10 text-red-400/60 disabled:opacity-50">
                  {desactivando ? 'Desactivando...' : 'Desactivar Trabajador'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Tabs + Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab bar */}
          <div className="flex overflow-x-auto gap-1 border-b no-scrollbar pb-1" style={{ borderColor: 'var(--color-borde)' }}>
            {[
              { key: 'info', label: 'Tallas EPP', icono: <User className="w-4 h-4" /> },
              { key: 'epp', label: `Entregas (${trabajador.entregasEpp?.length || 0})`, icono: <Package className="w-4 h-4" /> },
              { key: 'capacitaciones', label: `Capacitaciones (${trabajador.capacitaciones?.length || 0})`, icono: <GraduationCap className="w-4 h-4" /> },
              { key: 'historial', label: `Historial (${trabajador.amonestaciones?.length || 0})`, icono: <AlertTriangle className="w-4 h-4" /> },
              { key: 'inspecciones', label: `Inspecciones (${trabajador.inspecciones?.length || 0})`, icono: <ClipboardCheck className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setPestana(tab.key as any)}
                className={`flex items-center gap-2 px-4 min-h-[44px] shrink-0 text-sm font-bold transition-all border-b-2 outline-none focus:bg-white/5 ${pestana === tab.key ? 'border-primary-500 text-primary-400' : 'border-transparent hover:bg-white/5'}`}
                style={pestana === tab.key ? { borderColor: 'var(--color-primary-500)', color: 'var(--color-texto-principal)' } : { color: 'var(--color-texto-secundario)' }}
              >
                {tab.icono} <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-2 lg:p-4">
            {pestana === 'info' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Tallas de EPP</h3>
                  {!editando && (
                    <button onClick={() => setEditando(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Editar tallas">
                      <Edit3 className="w-4 h-4 text-blue-400" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { key: 'tallaCasco', label: 'Casco', valor: trabajador.tallaCasco },
                    { key: 'tallaCamisa', label: 'Camisa', valor: trabajador.tallaCamisa },
                    { key: 'tallaPantalon', label: 'Pantalón', valor: trabajador.tallaPantalon },
                    { key: 'tallaCalzado', label: 'Calzado', valor: trabajador.tallaCalzado },
                    { key: 'tallaGuantes', label: 'Guantes', valor: trabajador.tallaGuantes },
                  ].map(t => (
                    <div key={t.label} className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-texto-tenue)' }}>{t.label}</p>
                      {editando ? (
                        <input value={(formEdit as any)[t.key] || ''} onChange={e => setFormEdit({ ...formEdit, [t.key]: e.target.value })} className="w-full text-center bg-transparent border-b-2 text-lg font-bold outline-none focus:border-blue-500" style={{ borderColor: 'var(--color-primary-500)' }} />
                      ) : (
                        <p className="text-xl font-bold">{t.valor || '—'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pestana === 'epp' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-bold text-lg">Historial de Entregas</h3>
                  <button onClick={() => setMostrarModalEpp(true)} className="flex items-center gap-2 px-4 min-h-[44px] w-full sm:w-auto justify-center rounded-lg text-sm font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-transform active:scale-95 outline-none focus:ring-2 focus:ring-blue-500/50">
                    <Plus className="w-4 h-4" /> Registrar EPP
                  </button>
                </div>
                {trabajador.entregasEpp?.length ? (
                  <div className="space-y-3">
                    {trabajador.entregasEpp.map((epp: any) => (
                      <div key={epp.id} className="flex items-center justify-between py-3 px-2 rounded border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
                        <div>
                          <p className="font-medium">{epp.tipoEpp}</p>
                          <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{epp.marca && `${epp.marca} •`} Talla: {epp.talla || '—'}</p>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-bold text-lg">Historial de Capacitaciones</h3>
                  <button onClick={() => setMostrarModalCap(true)} className="flex items-center gap-2 px-4 min-h-[44px] w-full sm:w-auto justify-center rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-transform active:scale-95 outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <Plus className="w-4 h-4" /> Nueva Capacitación
                  </button>
                </div>
                {trabajador.capacitaciones?.length ? (
                  <div className="space-y-3">
                    {trabajador.capacitaciones.map((cap: any) => (
                      <div key={cap.id} className="flex items-center justify-between py-3 px-2 rounded border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
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
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-bold text-lg">Historial Disciplinario</h3>
                  <button onClick={() => setMostrarModalAmon(true)} className="flex items-center gap-2 px-4 min-h-[44px] w-full sm:w-auto justify-center rounded-lg text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-transform active:scale-95 outline-none focus:ring-2 focus:ring-red-500/50">
                    <Plus className="w-4 h-4" /> Registrar Amonestación
                  </button>
                </div>
                {trabajador.amonestaciones?.length ? (
                  <div className="space-y-3">
                    {trabajador.amonestaciones.map((am: any) => (
                      <div key={am.id} className="py-4 px-2 rounded border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--color-borde)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{am.motivo}</p>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
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
                ) : <EmptyState texto="Sin amonestaciones registradas" />}
              </div>
            )}

            {pestana === 'inspecciones' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Inspecciones Asociadas</h3>
                </div>
                {trabajador.inspecciones?.length ? (
                  <div className="space-y-3">
                    {trabajador.inspecciones.map((insp: any) => (
                      <div key={insp.id || insp.inspeccionId} className="flex items-center justify-between py-3 px-2 rounded border-b hover:bg-white/5 transition-colors cursor-pointer" style={{ borderColor: 'var(--color-borde)' }} onClick={() => navigate(`/inspecciones/${insp.inspeccionId || insp.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                            backgroundColor: insp.inspeccion?.estado === 'COMPLETADA' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                          }}>
                            <ClipboardCheck className="w-4 h-4" style={{ color: insp.inspeccion?.estado === 'COMPLETADA' ? 'var(--color-exito-500)' : 'var(--color-primary-400)' }} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{insp.inspeccion?.tipo || 'Inspección'}</p>
                            <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
                              {insp.inspeccion?.fecha
                                ? new Date(insp.inspeccion.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                              {insp.inspeccion?.sucursal?.nombre && ` • ${insp.inspeccion.sucursal.nombre}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
                            backgroundColor: insp.cumple ? 'rgba(34,197,94,0.15)' : insp.cumple === false ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: insp.cumple ? 'var(--color-exito-500)' : insp.cumple === false ? 'var(--color-peligro-500)' : 'var(--color-advertencia-500)',
                          }}>
                            {insp.cumple ? 'Cumple' : insp.cumple === false ? 'No cumple' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState texto="Sin inspecciones asociadas" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL QR ── */}
      <ModalPortal abierto={mostrarQR} onCerrar={() => setMostrarQR(false)}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-1">{trabajador.nombreCompleto}</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-texto-secundario)' }}>{trabajador.cargo} • DNI: {trabajador.dni}</p>
          <div className="bg-white p-4 rounded-xl flex justify-center mb-4">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trabajador.codigoQr || '')}&margin=10`} alt="QR Code" className="rounded-lg" />
          </div>
          <p className="text-xs font-mono break-all" style={{ color: 'var(--color-texto-tenue)' }}>ID: {trabajador.codigoQr}</p>
        </div>
      </ModalPortal>

      {/* ── MODAL EPP ── */}
      <ModalPortal abierto={mostrarModalEpp} onCerrar={() => setMostrarModalEpp(false)}>
        <div className="p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <h3 className="font-bold text-lg">Registrar Entrega EPP</h3>
          <button onClick={() => setMostrarModalEpp(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <form id="form-epp" onSubmit={manejarGuardarEpp} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Equipo <span className="text-red-500">*</span></label>
              <input required value={formEpp.tipoEpp} onChange={e => setFormEpp({ ...formEpp, tipoEpp: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej: Casco dieléctrico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Marca</label>
                <input value={formEpp.marca} onChange={e => setFormEpp({ ...formEpp, marca: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Talla</label>
                <input value={formEpp.talla} onChange={e => setFormEpp({ ...formEpp, talla: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-blue-500" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Entrega <span className="text-red-500">*</span></label>
                <input required type="date" value={formEpp.fechaEntrega} onChange={e => setFormEpp({ ...formEpp, fechaEntrega: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-blue-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Vencimiento</label>
                <input type="date" value={formEpp.fechaVencimiento} onChange={e => setFormEpp({ ...formEpp, fechaVencimiento: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-blue-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Observaciones</label>
              <textarea rows={2} value={formEpp.observaciones} onChange={e => setFormEpp({ ...formEpp, observaciones: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-blue-500 resize-none" style={{ borderColor: 'var(--color-borde)' }} />
            </div>
          </form>
        </div>
        <div className="p-5 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <button type="button" onClick={() => setMostrarModalEpp(false)} className="px-5 min-h-[44px] font-medium hover:bg-white/10 rounded-lg transition text-sm">Cancelar</button>
          <button form="form-epp" type="submit" className="px-6 min-h-[44px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-lg active:scale-95 text-sm outline-none focus:ring-2 focus:ring-blue-400">Guardar EPP</button>
        </div>
      </ModalPortal>

      {/* ── MODAL CAPACITACIÓN ── */}
      <ModalPortal abierto={mostrarModalCap} onCerrar={() => setMostrarModalCap(false)}>
        <div className="p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <h3 className="font-bold text-lg">Nueva Capacitación</h3>
          <button onClick={() => setMostrarModalCap(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <form id="form-cap" onSubmit={manejarGuardarCap} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Curso <span className="text-red-500">*</span></label>
              <input required value={formCap.nombreCurso} onChange={e => setFormCap({ ...formCap, nombreCurso: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-emerald-500" style={{ borderColor: 'var(--color-borde)' }} placeholder="Ej: Alturas nivel avanzado" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Institución</label>
              <input value={formCap.institucion} onChange={e => setFormCap({ ...formCap, institucion: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-emerald-500" style={{ borderColor: 'var(--color-borde)' }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Realización <span className="text-red-500">*</span></label>
                <input required type="date" value={formCap.fechaRealizacion} onChange={e => setFormCap({ ...formCap, fechaRealizacion: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-emerald-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Vencimiento</label>
                <input type="date" value={formCap.fechaVencimiento} onChange={e => setFormCap({ ...formCap, fechaVencimiento: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-emerald-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }} />
              </div>
            </div>
          </form>
        </div>
        <div className="p-5 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <button type="button" onClick={() => setMostrarModalCap(false)} className="px-5 min-h-[44px] font-medium hover:bg-white/10 rounded-lg transition text-sm">Cancelar</button>
          <button form="form-cap" type="submit" className="px-6 min-h-[44px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-lg active:scale-95 text-sm outline-none focus:ring-2 focus:ring-emerald-400">Guardar Curso</button>
        </div>
      </ModalPortal>

      {/* ── MODAL AMONESTACIÓN ── */}
      <ModalPortal abierto={mostrarModalAmon} onCerrar={() => setMostrarModalAmon(false)}>
        <div className="p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <h3 className="font-bold text-lg">Registrar Amonestación</h3>
          <button onClick={() => setMostrarModalAmon(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <form id="form-amon" onSubmit={manejarGuardarAmon} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Motivo <span className="text-red-500">*</span></label>
              <select required value={formAmon.motivo} onChange={e => setFormAmon({ ...formAmon, motivo: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-red-500 appearance-none" style={{ borderColor: 'var(--color-borde)' }}>
                <option value="">Seleccionar motivo...</option>
                <option value="No uso de EPP">No uso de EPP</option>
                <option value="Acto Inseguro">Acto Inseguro</option>
                <option value="Incumplimiento de procedimiento">Incumplimiento de procedimiento</option>
                <option value="Conducta inapropiada">Conducta inapropiada</option>
                <option value="Inasistencia injustificada">Inasistencia injustificada</option>
                <option value="Daño a equipo/herramienta">Daño a equipo/herramienta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Severidad <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {(['LEVE', 'GRAVE', 'CRITICA'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setFormAmon({ ...formAmon, severidad: s })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border ${formAmon.severidad === s ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-80'}`} style={{
                    borderColor: s === 'CRITICA' ? 'rgba(239,68,68,0.5)' : s === 'GRAVE' ? 'rgba(245,158,11,0.5)' : 'rgba(59,130,246,0.5)',
                    backgroundColor: formAmon.severidad === s ? (s === 'CRITICA' ? 'rgba(239,68,68,0.15)' : s === 'GRAVE' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)') : 'transparent',
                    color: s === 'CRITICA' ? '#ef4444' : s === 'GRAVE' ? '#f59e0b' : '#3b82f6',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Descripción <span className="text-red-500">*</span></label>
              <textarea required rows={3} value={formAmon.descripcion} onChange={e => setFormAmon({ ...formAmon, descripcion: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-red-500 resize-none" style={{ borderColor: 'var(--color-borde)' }} placeholder="Describa los hechos..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Testimonios (opcional)</label>
              <textarea rows={2} value={formAmon.testimonios} onChange={e => setFormAmon({ ...formAmon, testimonios: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-transparent border outline-none focus:border-red-500 resize-none" style={{ borderColor: 'var(--color-borde)' }} placeholder="Nombres de testigos..." />
            </div>
          </form>
        </div>
        <div className="p-5 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <button type="button" onClick={() => setMostrarModalAmon(false)} className="px-5 min-h-[44px] font-medium hover:bg-white/10 rounded-lg transition text-sm">Cancelar</button>
          <button form="form-amon" type="submit" className="px-6 min-h-[44px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-lg active:scale-95 text-sm outline-none focus:ring-2 focus:ring-red-400">Registrar Falta</button>
        </div>
      </ModalPortal>
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
