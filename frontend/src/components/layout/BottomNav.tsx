import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/auth.store';
import { ScanLine, ClipboardCheck, ListTodo, X, Send, AlertTriangle, Search, Plus } from 'lucide-react';
import api from '../../services/api';

/* ─── Tipos del DTO real (Ley 29783) ─── */
type TipoIncidente =
  | 'ACCIDENTE_LEVE'
  | 'ACCIDENTE_INCAPACITANTE'
  | 'ACCIDENTE_MORTAL'
  | 'INCIDENTE_PELIGROSO'
  | 'CASI_ACCIDENTE'
  | 'CONDICION_INSEGURA'
  | 'ACTO_INSEGURO';

const TIPOS_INCIDENTE: { val: TipoIncidente; label: string; peligro: 'alto' | 'medio' | 'bajo' }[] = [
  { val: 'ACCIDENTE_MORTAL',         label: 'Accidente Mortal',         peligro: 'alto'  },
  { val: 'ACCIDENTE_INCAPACITANTE',  label: 'Accidente Incapacitante',  peligro: 'alto'  },
  { val: 'ACCIDENTE_LEVE',           label: 'Accidente Leve',           peligro: 'medio' },
  { val: 'INCIDENTE_PELIGROSO',      label: 'Incidente Peligroso',      peligro: 'medio' },
  { val: 'CASI_ACCIDENTE',           label: 'Casi Accidente',           peligro: 'medio' },
  { val: 'CONDICION_INSEGURA',       label: 'Condición Insegura',       peligro: 'bajo'  },
  { val: 'ACTO_INSEGURO',            label: 'Acto Inseguro',            peligro: 'bajo'  },
];

const COLOR_PELIGRO = {
  alto:  { bg: 'bg-red-500/30',    text: 'text-red-100',    ring: 'ring-red-400'    },
  medio: { bg: 'bg-amber-500/25',  text: 'text-amber-100',  ring: 'ring-amber-400'  },
  bajo:  { bg: 'bg-blue-500/20',   text: 'text-blue-100',   ring: 'ring-blue-400'   },
};

/* ─── Modal de Incidente Rápido ─── */
function ModalIncidente({ onCerrar }: { onCerrar: () => void }) {
  const [descripcionBreve, setDescripcionBreve]   = useState('');
  const [tipo, setTipo]                           = useState<TipoIncidente>('ACCIDENTE_LEVE');
  const [dni, setDni]                             = useState('');
  const [buscandoDni, setBuscandoDni]             = useState(false);
  const [trabajadorEncontrado, setTrabajadorEncontrado] = useState<{ id: string; nombreCompleto: string } | null>(null);
  const [errorDni, setErrorDni]                   = useState('');
  const [enviando, setEnviando]                   = useState(false);
  const [enviado, setEnviado]                     = useState(false);
  const [error, setError]                         = useState('');

  /* Resolución DNI → UUID vía /trabajadores?busqueda={dni}&limit=1 */
  const buscarPorDni = async () => {
    const dniBuscado = dni.trim();
    if (!dniBuscado) return;
    setBuscandoDni(true);
    setErrorDni('');
    setTrabajadorEncontrado(null);
    try {
      const { data } = await api.get('/trabajadores', { params: { busqueda: dniBuscado, limit: 1 } });
      // La respuesta es PaginacionRespuesta<Trabajador> → { datos: Trabajador[] }
      const primero = data?.datos?.[0];
      if (!primero) {
        setErrorDni('No se encontró ningún trabajador con ese DNI.');
      } else {
        setTrabajadorEncontrado({ id: primero.id, nombreCompleto: primero.nombreCompleto });
      }
    } catch {
      setErrorDni('Error al buscar el trabajador. Inténtalo de nuevo.');
    } finally {
      setBuscandoDni(false);
    }
  };

  const puedeEnviar =
    descripcionBreve.trim().length >= 5 &&
    descripcionBreve.trim().length <= 500 &&
    trabajadorEncontrado !== null;

  const handleSubmit = async () => {
    if (!puedeEnviar || !trabajadorEncontrado) return;
    setEnviando(true);
    setError('');
    try {
      await api.post('/incidentes/rapido', {
        tipo,
        trabajadorId: trabajadorEncontrado.id,
        descripcionBreve: descripcionBreve.trim(),
      });
      setEnviado(true);
      setTimeout(onCerrar, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join(' · ')
          : (msg ?? 'No se pudo registrar el incidente. Inténtalo de nuevo.')
      );
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Fondo */}
      <div className="absolute inset-0 bg-black/70" onClick={!enviando ? onCerrar : undefined} />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-slide-in max-h-[92dvh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}
      >
        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--color-borde)', backgroundColor: 'var(--color-fondo-principal)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Registrar Incidente</h2>
              <p className="text-xs" style={{ color: 'var(--color-texto-tenue)' }}>Reporte rápido · Ley 29783</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={enviando}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-texto-secundario)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-5">
          {enviado ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-bold text-emerald-300">¡Incidente registrado!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-texto-tenue)' }}>Cerrando automáticamente…</p>
            </div>
          ) : (
            <>
              {/* Campo 1: Tipo de incidente */}
              <div>
                <label className="block text-sm font-semibold mb-2.5" style={{ color: 'var(--color-texto-secundario)' }}>
                  Tipo de incidente <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_INCIDENTE.map(t => {
                    const c = COLOR_PELIGRO[t.peligro];
                    const activo = tipo === t.val;
                    return (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setTipo(t.val)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-left leading-snug ${c.bg} ${c.text} ${
                          activo ? `ring-2 ${c.ring} border-transparent` : 'border-transparent opacity-55'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campo 2: DNI trabajador (requerido) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-texto-secundario)' }}>
                  DNI del trabajador involucrado <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={dni}
                    onChange={e => {
                      setDni(e.target.value.replace(/\D/g, ''));
                      setTrabajadorEncontrado(null);
                      setErrorDni('');
                    }}
                    onKeyDown={e => e.key === 'Enter' && buscarPorDni()}
                    className="flex-1 px-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-mono tracking-widest"
                    style={{ borderColor: 'var(--color-borde)' }}
                    placeholder="12345678"
                  />
                  <button
                    type="button"
                    onClick={buscarPorDni}
                    disabled={!dni.trim() || buscandoDni}
                    className="px-4 py-3 rounded-xl font-semibold text-sm bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {buscandoDni
                      ? <span className="w-4 h-4 rounded-full border-2 border-blue-300/40 border-t-blue-300 animate-spin" />
                      : <Search className="w-4 h-4" />
                    }
                    Buscar
                  </button>
                </div>
                {/* Resultado búsqueda */}
                {trabajadorEncontrado && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-300 truncate">{trabajadorEncontrado.nombreCompleto}</p>
                  </div>
                )}
                {errorDni && (
                  <p className="text-xs text-red-400 mt-1.5 bg-red-500/10 px-3 py-2 rounded-lg">{errorDni}</p>
                )}
              </div>

              {/* Campo 3: Descripción breve */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-texto-secundario)' }}>
                  Descripción breve <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={descripcionBreve}
                  onChange={e => setDescripcionBreve(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-red-500/40 resize-none text-sm"
                  style={{ borderColor: 'var(--color-borde)' }}
                  placeholder="Describe brevemente lo ocurrido (máx. 500 caracteres)…"
                />
                <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-texto-tenue)' }}>
                  {descripcionBreve.length}/500
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!enviado && (
          <div className="px-5 pb-6 pt-2 sticky bottom-0" style={{ backgroundColor: 'var(--color-fondo-principal)' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!puedeEnviar || enviando}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97] disabled:opacity-40 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              {enviando
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Send className="w-4 h-4" />
              }
              {enviando ? 'Enviando…' : 'Reportar Incidente'}
            </button>
            {!trabajadorEncontrado && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--color-texto-tenue)' }}>
                Busca al trabajador por DNI para activar el envío
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════
   BOTTOM NAV
   ══════════════════════════════════════════════════════════════ */

export default function BottomNav() {
  const location = useLocation();
  const { usuario } = useAuthStore();
  const [modalAbierto, setModalAbierto] = useState(false);

  if (!usuario) return null;

  // Ítems izquierdos y derechos al botón central de incidente
  const izquierda = [
    { nombre: 'Escáner', ruta: '/escaner',      icono: ScanLine },
  ];
  const derecha = [
    { nombre: 'Inspecciones', ruta: '/inspecciones', icono: ClipboardCheck },
    { nombre: 'Mis Tareas',   ruta: '/inspecciones', icono: ListTodo       },
  ];

  const isActive = (ruta: string) =>
    ruta === '/' ? location.pathname === '/' : location.pathname.startsWith(ruta);

  const NavLink = ({ nombre, ruta, icono: Icono }: { nombre: string; ruta: string; icono: any }) => (
    <Link
      to={ruta}
      className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors`}
      style={{
        minHeight: '64px',
        color: isActive(ruta) ? 'var(--color-primary-400)' : 'var(--color-texto-secundario)',
      }}
      aria-current={isActive(ruta) ? 'page' : undefined}
    >
      <Icono className={`w-6 h-6 mb-1 ${isActive(ruta) ? 'scale-110' : ''} transition-transform`} />
      <span className="text-[10px] font-medium tracking-wide leading-none">{nombre}</span>
    </Link>
  );

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full border-t z-50"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.97)',
          borderColor: 'var(--color-borde)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Navegación principal móvil"
      >
        <div className="flex items-center justify-around">
          {/* Izquierda */}
          {izquierda.map(item => <NavLink key={item.ruta + item.nombre} {...item} />)}

          {/* Botón central — FAB Incidente */}
          <div className="flex flex-col items-center justify-center flex-1 py-2 px-1" style={{ minHeight: '64px' }}>
            <button
              onClick={() => setModalAbierto(true)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-lg shadow-red-900/40"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
              aria-label="Registrar incidente"
            >
              <Plus className="w-7 h-7" />
            </button>
            <span className="text-[10px] font-bold mt-1 text-red-400 tracking-wide leading-none">Incidente</span>
          </div>

          {/* Derecha */}
          {derecha.map(item => <NavLink key={item.ruta + item.nombre} {...item} />)}
        </div>
      </nav>

      {/* Modal */}
      {modalAbierto && <ModalIncidente onCerrar={() => setModalAbierto(false)} />}
    </>
  );
}
