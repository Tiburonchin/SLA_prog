import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { amonestacionesService, type CrearAmonestacionData } from '../services/amonestaciones.service';

export interface AmonestacionOffline {
  id: string; // UUID temporal generado en el cliente
  datos: CrearAmonestacionData;
  creadoEn: string; // ISO timestamp
  intentosSincronizacion: number;
  ultimoError?: string;
}

interface AmonestacionesOfflineState {
  /** Amonestaciones pendientes de sincronización */
  pendientes: AmonestacionOffline[];
  /** Indica si hay una sincronización en curso */
  sincronizando: boolean;

  /** Agrega una amonestación al almacenamiento local (modo offline) */
  guardarOffline: (datos: CrearAmonestacionData) => void;
  /** Intenta enviar todas las amonestaciones pendientes al backend */
  sincronizarPendientes: () => Promise<{ enviadas: number; fallidas: number }>;
  /** Elimina una amonestación pendiente manualmente */
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

export const useAmonestacionesOfflineStore = create<AmonestacionesOfflineState>()(
  persist(
    (set, get) => ({
      pendientes: [],
      sincronizando: false,

      guardarOffline: (datos) => {
        const nueva: AmonestacionOffline = {
          id: uuidLocal(),
          datos,
          creadoEn: new Date().toISOString(),
          intentosSincronizacion: 0,
        };
        set((state) => ({ pendientes: [...state.pendientes, nueva] }));
      },

      sincronizarPendientes: async () => {
        const { pendientes } = get();
        if (pendientes.length === 0 || get().sincronizando) {
          return { enviadas: 0, fallidas: 0 };
        }

        set({ sincronizando: true });
        let enviadas = 0;
        let fallidas = 0;

        for (const amon of pendientes) {
          try {
            await amonestacionesService.crear(amon.datos);
            // Eliminar del store tras éxito
            set((state) => ({
              pendientes: state.pendientes.filter((p) => p.id !== amon.id),
            }));
            enviadas++;
          } catch (err: any) {
            // Marcar el intento fallido pero conservar la inspección
            set((state) => ({
              pendientes: state.pendientes.map((p) =>
                p.id === amon.id
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
      name: 'hse-amonestaciones-offline', // clave en localStorage
    }
  )
);
