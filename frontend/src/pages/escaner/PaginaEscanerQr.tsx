import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { trabajadoresService } from '../../services/trabajadores.service';
import { ScanLine, AlertCircle } from 'lucide-react';

export default function PaginaEscanerQr() {
  const navigate = useNavigate();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configuración del escáner
    const scanner = new Html5QrcodeScanner(
      'lector-qr',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    const onScanSuccess = async (decodedText: string) => {
      if (procesando) return;
      setProcesando(true);
      setError(null);
      
      // Pausar UI del scanner mientras validamos
      scanner.pause();

      try {
        // Enviar el token crudo al backend
        const resultado = await trabajadoresService.buscarPorQr(decodedText);
        
        // Si es válido, desmontamos y redirigimos
        scanner.clear();
        navigate(`/trabajadores/${resultado.id}`);
      } catch (err: any) {
        // Si hay error (ej: QR no válido), mostramos error y reanudamos en 3 segundos
        setError(err.response?.data?.message || 'Código QR no reconocido o inválido');
        setTimeout(() => {
          setProcesando(false);
          setError(null);
          scanner.resume();
        }, 3000);
      }
    };

    const onScanFailure = (error: any) => {
      // Html5QrcodeScanner emite muchos warnings internos por frames borrosos.
      // Se ignoran por diseño a menos que sea un crash crítico.
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Limpieza al desmontar el componente (salir de la pestaña)
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [navigate, procesando]);

  return (
    <div className="max-w-md mx-auto py-10 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
          <ScanLine className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Escáner de Auditoría</h1>
        <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
          Apunta la cámara al código QR del empleado para abrir su Perfil 360° y verificar acreditaciones.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-2xl relative" style={{ backgroundColor: 'var(--color-fondo-principal)', border: '1px solid var(--color-borde)' }}>
        
        {/* Contenedor DOM para la librería html5-qrcode */}
        <div id="lector-qr" className="w-full h-full min-h-[300px]" />

        {/* Overlay de Carga */}
        {procesando && !error && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur flex flex-col items-center justify-center text-white z-50">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium animate-pulse">Obteniendo perfil...</p>
          </div>
        )}

        {/* Overlay de Error */}
        {error && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur flex flex-col items-center justify-center text-white p-6 text-center z-50">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="font-bold text-red-400 mb-2">Error de lectura</p>
            <p className="text-sm text-gray-300">{error}</p>
            <p className="text-xs text-gray-500 mt-6 mt-4">Reanudando cámara...</p>
          </div>
        )}
      </div>

      {/* Nota técnica */}
      <div className="mt-8 text-center text-xs" style={{ color: 'var(--color-texto-tenue)' }}>
        Requiere permisos de cámara y una conexión a internet activa.
      </div>
    </div>
  );
}
