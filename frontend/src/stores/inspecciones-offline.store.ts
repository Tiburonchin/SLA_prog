/**
 * Store de Inspecciones Offline — Sistema HSE
 *
 * [PRD §6 / Fase 2 - PWA Offline]
 * Este store implementa persistencia local mediante el middleware `persist`
 * de Zustand. Su propósito es asegurar que las inspecciones creadas en campo
 * (sin conexión a internet) no se pierdan.
 *
 * Flujo:
 * 1. El supervisor crea una inspección offline → se guarda en `localStorage`.
 * 2. Cuando la app detecta conexión, `sincronizarPendientes()` envía las
 *    inspecciones acumuladas al backend y las elimina del store local.
 *
 * Nota: Para una PWA completa en producción, este store debería migrar
 * de localStorage a IndexedDB (vía Workbox) para manejar datos más pesados
 * como fotos de evidencia. Este es el andamiaje inicial requerido.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { inspeccionesService, type CrearInspeccionData } from '../services/inspecciones.service';

export interface InspeccionOffline {
  id: string; // UUID temporal generado en el cliente
  datos: CrearInspeccionData;
  creadoEn: string; // ISO timestamp
  intentosSincronizacion: number;
  ultimoError?: string;
}

interface InspeccionesOfflineState {
  /** Inspecciones pendientes de sincronización */
  pendientes: InspeccionOffline[];
  /** Indica si hay una sincronización en curso */
  sincronizando: boolean;

  /** Agrega una inspección al almacenamiento local (modo offline) */
  guardarOffline: (datos: CrearInspeccionData) => void;
  /** Intenta enviar todas las inspecciones pendientes al backend */
  sincronizarPendientes: (usuario: any) => Promise<{ enviadas: number; fallidas: number }>;
  /** Elimina una inspección pendiente manualmente */
  eliminarPendiente: (id: string) => void;
  /** Limpia todas las pendientes (solo para admin/debugging) */
  limpiarTodas: () => void;
}

/**
 * Genera un UUID v4 simple para uso temporal en el cliente.
 * No se usa en la base de datos; el backend generará su propio UUID.
 */
function uuidLocal(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const useInspeccionesOfflineStore = create<InspeccionesOfflineState>()(
  persist(
    (set, get) => ({
      pendientes: [],
      sincronizando: false,

      guardarOffline: (datos) => {
        const nueva: InspeccionOffline = {
          id: uuidLocal(),
          datos,
          creadoEn: new Date().toISOString(),
          intentosSincronizacion: 0,
        };
        set((state) => ({ pendientes: [...state.pendientes, nueva] }));
      },

      sincronizarPendientes: async (usuario) => {
        const { pendientes } = get();
        if (pendientes.length === 0 || get().sincronizando) {
          return { enviadas: 0, fallidas: 0 };
        }

        set({ sincronizando: true });
        let enviadas = 0;
        let fallidas = 0;

        for (const insp of pendientes) {
          try {
            await inspeccionesService.crear(insp.datos);
            // Eliminar del store tras éxito
            set((state) => ({
              pendientes: state.pendientes.filter((p) => p.id !== insp.id),
            }));
            enviadas++;
          } catch (err: any) {
            // Marcar el intento fallido pero conservar la inspección
            set((state) => ({
              pendientes: state.pendientes.map((p) =>
                p.id === insp.id
                  ? {
                      ...p,
                      intentosSincronizacion: p.intentosSincronizacion + 1,
                      ultimoError: err.response?.data?.message || 'Error de red',
                    }
                  : p
              ),
            }));
            fallidas++;
          }
        }

        set({ sincronizando: false });
        return { enviadas, fallidas };
      },

      eliminarPendiente: (id) => {
        set((state) => ({
          pendientes: state.pendientes.filter((p) => p.id !== id),
        }));
      },

      limpiarTodas: () => set({ pendientes: [] }),
    }),
    {
      name: 'hse-inspecciones-offline', // clave en localStorage
    }
  )
);
