import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { weatherService } from '../../services/weather.service';
import type { WeatherAlertInfo } from '../../services/weather.service';
import { sucursalesService } from '../../services/trabajadores.service';
import { ThermometerSun, AlertTriangle } from 'lucide-react';

export default function AlertaClimatica() {
  const { usuario } = useAuthStore();
  const [alerta, setAlerta] = useState<WeatherAlertInfo | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let sucursalId = (usuario as any)?.sucursalId;
        if (!sucursalId) {
          const sucursales = await sucursalesService.obtenerTodas();
          if (sucursales.length > 0) sucursalId = sucursales[0].id;
        }
        if (sucursalId) {
          const data = await weatherService.obtenerAlerta(sucursalId);
          setAlerta(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchWeather();
  }, [usuario]);

  if (!alerta) return null;

  const bgStyles = {
    BAJO: 'bg-green-500/10 border-green-500/30 text-green-400',
    MEDIO: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    ALTO: 'bg-red-500/10 border-red-500/30 text-red-500',
  }[alerta.riskLevel] || 'bg-gray-800 border-gray-700 text-gray-400';

  const IconBgStyles = {
    BAJO: 'bg-green-500/20',
    MEDIO: 'bg-yellow-500/20',
    ALTO: 'bg-red-500/20 animate-pulse',
  }[alerta.riskLevel];

  const mensajes = {
    BAJO: 'Condición climática segura para actividades normales.',
    MEDIO: 'Precaución: Implementar pausas de hidratación cada 45 min.',
    ALTO: 'PELIGRO! Riesgo de golpe de calor. Hidratación mandatoria cada 20 min.',
  }[alerta.riskLevel];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border animate-fade-in ${bgStyles}`}>
      <div className={`p-3 rounded-lg ${IconBgStyles}`}>
        {alerta.riskLevel === 'ALTO' ? <AlertTriangle className="w-6 h-6" /> : <ThermometerSun className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <h3 className="font-bold">
          Estrés Térmico: {alerta.riskLevel}
        </h3>
        <p className="text-sm opacity-90 leading-tight mt-1">{mensajes}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black">{alerta.temp}°C</p>
        <p className="text-xs uppercase font-bold tracking-wider opacity-80 mt-1">WBGT: {alerta.wbgt}</p>
      </div>
    </div>
  );
}
