import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Phone, Droplet, ArrowLeft, HeartPulse, ShieldAlert } from 'lucide-react';
import { trabajadoresService } from '../../services/trabajadores.service';

export default function PaginaEmergencia() {
  const { trabajadorId } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!trabajadorId) return;
    trabajadoresService.obtenerEmergencia(trabajadorId)
      .then(setDatos)
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar datos médicos'))
      .finally(() => setCargando(false));
  }, [trabajadorId]);

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white" style={{ backgroundColor: 'var(--color-peligro-600)' }}>
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold animate-pulse">Cargando Datos de Emergencia...</p>
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-900 text-white text-center">
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-4">Error de Acceso</h1>
        <p className="text-xl text-zinc-400 mb-8">{error}</p>
        <button onClick={() => navigate(-1)} className="px-8 py-4 bg-zinc-800 rounded-xl text-xl font-bold min-h-[64px] min-w-[200px] hover:bg-zinc-700 transition">
          Volver Atrás
        </button>
      </div>
    );
  }

  const esPeligro = datos.estadoEMO === 'NO_APTO' || datos.estadoEMO === 'APTO_RESTRICCION';

  return (
    <div className="min-h-screen text-white animate-fade-in pb-12" style={{ backgroundColor: 'var(--color-peligro-600)' }}>
      {/* Header Fijo */}
      <div className="sticky top-0 z-50 px-6 py-4 flex items-center gap-4 bg-red-700 shadow-xl border-b border-red-500/50">
        <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-white/10 transition active:scale-95" aria-label="Volver">
          <ArrowLeft className="w-8 h-8" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase flex items-center gap-3">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            Emergencia Médica
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        {/* Identificación */}
        <div className="bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Paciente</h2>
          <p className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-4">{datos.nombreCompleto}</p>
          <div className="flex flex-wrap items-center gap-4 text-lg font-semibold text-zinc-600">
            <span className="bg-zinc-100 px-4 py-2 rounded-xl border border-zinc-200">DNI: {datos.dni}</span>
            {esPeligro && (
               <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl flex items-center gap-2">
                 <AlertCircle className="w-5 h-5" /> EMO: {datos.estadoEMO.replace(/_/g, ' ')}
               </span>
            )}
          </div>
        </div>

        {/* Datos Clínicos Vitales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-red-800/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-red-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-500 p-3 rounded-2xl"><Droplet className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold uppercase tracking-wider">Tipo de Sangre</h3>
            </div>
            <p className="text-5xl font-black text-center py-4">{datos.tipoSangre || 'Desconocido'}</p>
          </div>

          <div className="bg-red-800/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-red-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-500 p-3 rounded-2xl"><HeartPulse className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold uppercase tracking-wider">Alergias / Condiciones</h3>
            </div>
            {/* Si hubiera campo alergias en el backend, iría aquí */}
            <div className="space-y-3">
              <p className="text-2xl font-bold text-orange-200">
                {datos.alergias || 'Sin alergias registradas'}
              </p>
              {datos.condicionesPreexistentes && (
                <div className="mt-2 p-3 rounded-xl bg-black/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-300 mb-1">Condiciones Preexistentes</p>
                  <p className="text-lg font-semibold">{datos.condicionesPreexistentes}</p>
                </div>
              )}
              {datos.eps && (
                <p className="text-sm text-red-200">EPS: <strong>{datos.eps}</strong></p>
              )}
              {datos.arl && (
                <p className="text-sm text-red-200">ARL: <strong>{datos.arl}</strong></p>
              )}
            </div>
          </div>
        </div>

        {/* Contacto de Emergencia */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Phone className="w-8 h-8" /> Llame a Contacto de Emergencia
          </h3>
          {datos.contactoEmergencia || datos.telefonoEmergencia ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-black/30 p-6 rounded-2xl">
              <div>
                <p className="text-xl font-medium text-red-200 mb-1">Contacto Autorizado</p>
                <p className="text-3xl font-black">{datos.contactoEmergencia || 'Familiar'}</p>
                <p className="text-2xl mt-2 font-mono text-white/80">{datos.telefonoEmergencia}</p>
              </div>
              <a 
                href={`tel:${datos.telefonoEmergencia}`} 
                className="w-full sm:w-auto px-10 py-5 bg-green-500 hover:bg-green-400 text-white rounded-2xl font-black text-2xl uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              >
                <Phone className="w-8 h-8" /> Llamar
              </a>
            </div>
          ) : (
            <div className="bg-red-900/50 p-6 rounded-2xl text-center border dashed border-red-500/50">
              <p className="text-xl font-bold text-red-200">No hay contacto de emergencia registrado.</p>
            </div>
          )}
        </div>

        {/* Capacitaciones de Primeros Auxilios */}
        {datos.capacitaciones && datos.capacitaciones.length > 0 && (
          <div className="bg-indigo-900/50 rounded-3xl p-6 sm:p-8 border border-indigo-500/30">
            <h3 className="text-xl font-bold mb-4 text-indigo-200">Brigadista / Primeros Auxilios</h3>
            <div className="space-y-3">
              {datos.capacitaciones.map((cap: any, i: number) => (
                <div key={i} className="bg-black/20 p-4 rounded-xl flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-indigo-400" />
                  <span className="font-semibold text-lg">{cap.nombreCurso}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
