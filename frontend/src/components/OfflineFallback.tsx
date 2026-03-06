import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OfflineFallback() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Opcional: navegar de vuelta al inicio cuando vuelva la red, 
      // o dejar que el usuario haga click
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--color-fondo-app)' }}>
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238L3 3" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3 text-white">Sin Conexión</h1>
      <p className="mb-8" style={{ color: 'var(--color-texto-secundario)' }}>
        Parece que estás en una zona sin cobertura. Verifica tu red Wi-Fi o conexión de datos.
      </p>

      {isOnline ? (
        <button 
          onClick={() => navigate('/')}
          className="bg-primary-500 text-white font-bold py-3 px-8 rounded-xl active:scale-95 transition-transform"
        >
          Volver a la App
        </button>
      ) : (
        <button 
          onClick={() => window.location.reload()}
          className="bg-gray-700 text-white font-bold py-3 px-8 rounded-xl active:scale-95 transition-transform"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
