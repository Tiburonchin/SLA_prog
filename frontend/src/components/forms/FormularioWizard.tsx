import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

export interface PasoWizard {
  titulo: string;
  descripcion?: string;
  contenido: ReactNode;
  /** Return true if valid, or a string error message */
  validar?: () => true | string;
}

interface FormularioWizardProps {
  titulo: string;
  icono?: ReactNode;
  pasos: PasoWizard[];
  onSubmit: () => void | Promise<void>;
  onCancelar: () => void;
  guardando?: boolean;
  textoBotonFinal?: string;
}

export default function FormularioWizard({
  titulo,
  icono,
  pasos,
  onSubmit,
  onCancelar,
  guardando = false,
  textoBotonFinal = 'Guardar',
}: FormularioWizardProps) {
  const [pasoActual, setPasoActual] = useState(0);
  const [errorPaso, setErrorPaso] = useState('');
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante');

  const total = pasos.length;
  const paso = pasos[pasoActual];
  const esUltimo = pasoActual === total - 1;
  const esPrimero = pasoActual === 0;
  const progreso = ((pasoActual + 1) / total) * 100;

  const avanzar = () => {
    setErrorPaso('');
    if (paso.validar) {
      const resultado = paso.validar();
      if (resultado !== true) {
        setErrorPaso(resultado);
        return;
      }
    }
    setDireccion('adelante');
    setPasoActual(prev => Math.min(prev + 1, total - 1));
  };

  const retroceder = () => {
    setErrorPaso('');
    setDireccion('atras');
    setPasoActual(prev => Math.max(prev - 1, 0));
  };

  const manejarSubmit = async () => {
    setErrorPaso('');
    if (paso.validar) {
      const resultado = paso.validar();
      if (resultado !== true) {
        setErrorPaso(resultado);
        return;
      }
    }
    await onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--color-borde)' }}>
          <div className="flex items-center gap-3">
            {icono}
            <div>
              <h2 className="font-bold text-lg leading-tight">{titulo}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-tenue)' }}>
                Paso {pasoActual + 1} de {total} — {paso.titulo}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            disabled={guardando}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-1.5 shrink-0" style={{ backgroundColor: 'var(--color-fondo-card)' }}>
          <div
            className="h-full rounded-r-full transition-all duration-500 ease-out"
            style={{
              width: `${progreso}%`,
              background: esUltimo
                ? 'linear-gradient(90deg, var(--color-exito-500), #15803d)'
                : 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400))',
            }}
          />
        </div>

        {/* Indicadores de pasos */}
        <div className="flex items-center justify-center gap-2 py-3 px-4 shrink-0">
          {pasos.map((p, i) => (
            <button
              key={i}
              onClick={() => { if (i < pasoActual) { setDireccion('atras'); setPasoActual(i); setErrorPaso(''); } }}
              disabled={i > pasoActual}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                i === pasoActual
                  ? 'bg-white/10 text-white ring-1 ring-white/20'
                  : i < pasoActual
                    ? 'text-green-400 bg-green-500/10 cursor-pointer hover:bg-green-500/20'
                    : 'text-gray-500 cursor-default'
              }`}
            >
              {i < pasoActual ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold ${
                  i === pasoActual ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
                }`}>
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{p.titulo}</span>
            </button>
          ))}
        </div>

        {/* Contenido del paso actual */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {errorPaso && (
            <div
              className="mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-slide-in"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-peligro-500)' }}
            >
              {errorPaso}
            </div>
          )}

          {paso.descripcion && (
            <p className="text-sm mb-4" style={{ color: 'var(--color-texto-secundario)' }}>
              {paso.descripcion}
            </p>
          )}

          <div
            key={pasoActual}
            className={`space-y-5 ${
              direccion === 'adelante' ? 'animate-slide-in' : 'animate-fade-in'
            }`}
          >
            {paso.contenido}
          </div>

          {/* Espacio para scroll en móvil */}
          <div className="h-6 sm:hidden" />
        </div>

        {/* Footer con botones (sticky en thumb zone) */}
        <div
          className="p-4 sm:p-5 border-t flex gap-3 shrink-0"
          style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-principal)' }}
        >
          {!esPrimero ? (
            <button
              type="button"
              onClick={retroceder}
              disabled={guardando}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-lg font-medium text-sm border transition-colors hover:bg-white/5 disabled:opacity-50 flex-1 sm:flex-none"
              style={{ borderColor: 'var(--color-borde)', color: 'var(--color-texto-principal)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="flex items-center justify-center px-4 py-3 min-h-[48px] rounded-lg font-medium text-sm transition-colors hover:bg-white/5 disabled:opacity-50 flex-1 sm:flex-none"
              style={{ color: 'var(--color-texto-secundario)' }}
            >
              Cancelar
            </button>
          )}

          {esUltimo ? (
            <button
              type="button"
              onClick={manejarSubmit}
              disabled={guardando}
              className="flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-lg font-bold text-sm text-white transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg flex-1"
              style={{ background: 'linear-gradient(135deg, var(--color-exito-500), #15803d)' }}
            >
              <Check className="w-4 h-4" />
              {guardando ? 'Procesando...' : textoBotonFinal}
            </button>
          ) : (
            <button
              type="button"
              onClick={avanzar}
              disabled={guardando}
              className="flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-lg font-bold text-sm text-white transition-all active:scale-[0.98] shadow-lg flex-1"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
