import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  CheckSquare,
  Square,
  MapPin,
  Users,
  PenTool
} from 'lucide-react';
import { inspeccionesService, type Inspeccion, type ItemChecklist } from '../../services/inspecciones.service';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  EN_PROGRESO: { label: 'En Progreso', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Clock },
  COMPLETADA: { label: 'Completada', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: AlertCircle },
};

import React, { Component, type ReactNode } from 'react';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <h2 className="text-xl font-bold mb-4">Error de Renderizado</h2>
          <pre className="whitespace-pre-wrap text-sm">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function PaginaDetalleInspeccion() {
  return (
    <ErrorBoundary>
      <DetalleInspeccionContenido />
    </ErrorBoundary>
  );
}

function DetalleInspeccionContenido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  
  // Estado local para edición del checklist
  const [checklistLocal, setChecklistLocal] = useState<ItemChecklist[]>([]);
  const [observacionesLocal, setObservacionesLocal] = useState('');

  // Firma
  const sigCanvas = useRef<any>(null);
  const [modalFirma, setModalFirma] = useState(false);

  const cargar = async () => {
    if (!id) return;
    setCargando(true);
    try {
      const data = await inspeccionesService.obtenerPorId(id);
      setInspeccion(data);
      
      let parsedChecklist = data.checklist || [];
      if (typeof parsedChecklist === 'string') {
        try { parsedChecklist = JSON.parse(parsedChecklist); } catch (e) { parsedChecklist = []; }
      }
      if (!Array.isArray(parsedChecklist)) parsedChecklist = [];
      
      setChecklistLocal(parsedChecklist);
      setObservacionesLocal(data.observaciones || '');
    } catch (error) {
      console.error('Error al cargar inspección:', error);
      navigate('/inspecciones');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const toggleItem = (index: number) => {
    if (inspeccion?.estado !== 'EN_PROGRESO') return;
    const nuevosItems = [...checklistLocal];
    nuevosItems[index] = {
      ...nuevosItems[index],
      aprobado: !nuevosItems[index].aprobado,
    };
    setChecklistLocal(nuevosItems);
  };

  const manejarGuardarProgreso = async () => {
    if (!id || inspeccion?.estado !== 'EN_PROGRESO') return;
    setGuardando(true);
    try {
      await inspeccionesService.actualizarChecklist(id, checklistLocal, observacionesLocal);
      await cargar();
    } catch (error) {
      console.error('Error guardando progreso:', error);
      alert('Hubo un error al guardar el progreso.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCerrar = async () => {
    if (!id || inspeccion?.estado !== 'EN_PROGRESO') return;
    
    // Verificar si todos los ítems están aprobados
    const pendientes = checklistLocal.filter(item => !item.aprobado).length;
    if (pendientes > 0) {
      const confirmar = window.confirm(`Aún hay ${pendientes} ítems pendientes por aprobar. ¿Deseas firmar y cerrar la inspección de todas formas?`);
      if (!confirmar) return;
    }
    setModalFirma(true);
  };

  const confirmarCierreConFirma = async () => {
    if (!id || inspeccion?.estado !== 'EN_PROGRESO') return;
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor, registre su firma para continuar.');
      return;
    }

    setCerrando(true);
    const firmaBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

    try {
      // Intentar obtener geolocalización
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await inspeccionesService.cerrar(id, {
              latitudCierre: position.coords.latitude,
              longitudCierre: position.coords.longitude,
              firmaBase64
            });
            setModalFirma(false);
            await cargar();
            setCerrando(false);
          },
          async () => {
            // Si rechaza ubicación, cerrar de todos modos sin coords
            await inspeccionesService.cerrar(id, { firmaBase64 });
            setModalFirma(false);
            await cargar();
            setCerrando(false);
          }
        );
      } else {
        await inspeccionesService.cerrar(id, { firmaBase64 });
        setModalFirma(false);
        await cargar();
        setCerrando(false);
      }
    } catch (error) {
      console.error('Error al cerrar inspección:', error);
      alert('Error al cerrar la inspección');
      setCerrando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary-500)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!inspeccion) return null;

  const est = ESTADO_CONFIG[inspeccion.estado];
  const IconoEstado = est?.icon || AlertCircle;
  const modificada = JSON.stringify(inspeccion.checklist) !== JSON.stringify(checklistLocal) || inspeccion.observaciones !== observacionesLocal;
  const aprobados = checklistLocal.filter(i => i.aprobado).length;
  const totalItems = checklistLocal.length;
  const progreso = totalItems === 0 ? 0 : Math.round((aprobados / totalItems) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inspecciones')}
          className="p-2 rounded-xl transition-all hover:bg-white/5 active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-texto-secundario)' }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{inspeccion.tipoTrabajo}</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: est?.bg || 'transparent', color: est?.color || '#000' }}>
              <IconoEstado className="w-3.5 h-3.5" /> {est?.label || inspeccion.estado}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
            Inspección ID: {inspeccion.id.split('-')[0].toUpperCase()}
          </p>
        </div>
        
        {inspeccion.estado === 'EN_PROGRESO' && (
          <div className="flex items-center gap-3">
            {modificada && (
              <button
                onClick={manejarGuardarProgreso}
                disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
              >
                <Save className="w-4 h-4" />
                {guardando ? 'Guardando...' : 'Guardar Progreso'}
              </button>
            )}
            <button
              onClick={manejarCerrar}
              disabled={cerrando || guardando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {cerrando ? 'Cerrando...' : 'Cerrar Inspección'}
            </button>
          </div>
        )}
      </div>

      {/* Tarjes de info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Ubicación</h3>
          </div>
          <p className="font-semibold text-lg">{inspeccion.sucursal?.nombre}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>{inspeccion.ubicacion}</p>
        </div>

        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Equipo Trabajo</h3>
          </div>
          <p className="font-semibold text-lg">{inspeccion.supervisor?.usuario?.nombreCompleto}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>Supervisor a cargo</p>
        </div>

        <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <ClipboardCheck className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Progreso</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="font-bold text-3xl">{progreso}%</p>
            <p className="text-sm mb-1" style={{ color: 'var(--color-texto-secundario)' }}>({aprobados}/{totalItems})</p>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%`, backgroundColor: progreso === 100 ? 'var(--color-exito-500)' : 'var(--color-primary-500)' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
              Puntos de Verificación
            </h2>
            
            {totalItems === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-texto-tenue)' }}>
                No hay puntos de verificación asignados.
              </div>
            ) : (
              <div className="space-y-3">
                {checklistLocal.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => toggleItem(idx)}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${inspeccion.estado === 'EN_PROGRESO' ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
                    style={{ 
                      borderColor: item.aprobado ? 'var(--color-exito-500)' : 'var(--color-borde)',
                      backgroundColor: item.aprobado ? 'rgba(34, 197, 94, 0.05)' : 'var(--color-fondo-principal)'
                    }}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {item.aprobado ? (
                        <CheckSquare className="w-5 h-5 text-green-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.aprobado ? 'text-green-500' : ''}`}>
                        {item.descripcion}
                      </p>
                      {item.observacion && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texto-secundario)' }}>Nota: {item.observacion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalles Adicionales */}
        <div className="space-y-6">
          <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
            <h3 className="font-bold mb-3">Observaciones Generales</h3>
            {inspeccion.estado === 'EN_PROGRESO' ? (
              <textarea
                value={observacionesLocal}
                onChange={e => setObservacionesLocal(e.target.value)}
                placeholder="Escribe comentarios u observaciones encontradas durante la inspección..."
                className="w-full h-32 p-3 rounded-lg text-sm bg-transparent border outline-none resize-none transition focus:ring-2"
                style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
              />
            ) : (
              <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
                {inspeccion.observaciones || <span className="text-gray-500">Sin observaciones generales.</span>}
              </p>
            )}
          </div>

          <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
            <h3 className="font-bold mb-3">Trabajadores en Zona</h3>
            {inspeccion.trabajadores && inspeccion.trabajadores.length > 0 ? (
              <div className="space-y-2">
                {inspeccion.trabajadores.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-fondo-principal)', borderColor: 'var(--color-borde)' }}>
                    <div>
                      <p className="text-sm font-medium">{t.trabajador.nombreCompleto}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>{t.trabajador.cargo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm p-4 text-center rounded-lg border border-dashed" style={{ color: 'var(--color-texto-tenue)', borderColor: 'var(--color-borde)' }}>
                No se vincularon trabajadores específicos a esta inspección.
              </p>
            )}
          </div>
          
          {inspeccion.fechaCierre && (
            <div className="text-xs text-center" style={{ color: 'var(--color-texto-tenue)' }}>
              Cerrada el {new Date(inspeccion.fechaCierre).toLocaleString('es-MX', { timeZone: 'UTC' })}
              {inspeccion.latitudCierre && <br />}
              {inspeccion.latitudCierre && `Geolocalización: ${inspeccion.latitudCierre.toFixed(4)}, ${inspeccion.longitudCierre?.toFixed(4)}`}
            </div>
          )}

          {inspeccion.estado === 'COMPLETADA' && inspeccion.firmaBase64 && (
            <div className="rounded-xl p-6 border text-center" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
              <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Firma del Supervisor</h3>
              <img src={inspeccion.firmaBase64} alt="Firma" className="mx-auto rounded bg-white p-2 border border-gray-200" style={{ maxHeight: '120px' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--color-texto-tenue)' }}>Signatario validado digitalmente</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Firma */}
      {modalFirma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 border" style={{ backgroundColor: 'var(--color-fondo-card)', borderColor: 'var(--color-borde)' }}>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-500" />
              Firma Digital Requerida
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-texto-secundario)' }}>
              Para cerrar la inspección legalmente, por favor firme en el recuadro inferior.
            </p>
            
            <div className="border-2 rounded-xl mb-4 bg-white overflow-hidden" style={{ borderColor: 'var(--color-borde)' }}>
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'sigCanvas w-full h-48 cursor-crosshair' }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <button onClick={() => sigCanvas.current?.clear()} className="text-xs text-blue-500 hover:text-blue-400 font-medium">
                Limpiar Firma
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setModalFirma(false)}
                disabled={cerrando}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarCierreConFirma}
                disabled={cerrando}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-lg hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}
              >
                {cerrando ? 'Procesando...' : 'Firmar y Cerrar Inspección'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
