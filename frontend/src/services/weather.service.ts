import api from './api';

export interface WeatherAlertInfo {
  wbgt: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  temp: number;
}

export const weatherService = {
  async obtenerAlerta(sucursalId: string): Promise<WeatherAlertInfo> {
    const { data } = await api.get<WeatherAlertInfo>(`/weather/alert/${sucursalId}`);
    return data;
  }
};
