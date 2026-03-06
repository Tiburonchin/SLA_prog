import { useState, useCallback } from 'react';

export function useNfcReader() {
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soportado] = useState('NDEFReader' in window);

  const leerNfc = useCallback(async (): Promise<string | null> => {
    if (!soportado) {
      setError('Lector NFC no soportado en este navegador/dispositivo.');
      return null;
    }

    try {
      setLeyendo(true);
      setError(null);
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();
      
      return new Promise((resolve) => {
        ndef.addEventListener('reading', ({ serialNumber }: any) => {
          setLeyendo(false);
          resolve(serialNumber); // Usamos el serial number como identificador único
        }, { once: true });

        ndef.addEventListener('readingerror', () => {
          setLeyendo(false);
          setError('Error al leer la etiqueta NFC, acerque el dispositivo de nuevo.');
          resolve(null);
        }, { once: true });
        
        // Timeout de seguridad
        setTimeout(() => {
          setLeyendo(current => {
            if (current) {
              setError('Tiempo de espera agotado. Intente de nuevo.');
              resolve(null);
            }
            return false;
          });
        }, 15000);
      });
    } catch (err: any) {
      setLeyendo(false);
      setError(err.message || 'Error al encender lector NFC.');
      return null;
    }
  }, [soportado]);

  const cancelarLectura = useCallback(() => {
    if (leyendo) {
      setLeyendo(false);
      setError(null);
      // La API NFC web no tiene un abort() estandarizado aún de fácil uso cross-browser,
      // pero actualizamos UI state.
    }
  }, [leyendo]);

  return { leerNfc, cancelarLectura, leyendo, error, soportado };
}
