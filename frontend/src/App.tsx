import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth.store';
import Layout from './components/layout/Layout';
import RutaProtegida from './components/layout/RutaProtegida';
import PaginaLogin from './pages/auth/PaginaLogin';
import PaginaDashboard from './pages/dashboard/PaginaDashboard';
import PaginaTrabajadores from './pages/trabajadores/PaginaTrabajadores';
import PaginaDetalleTrabajador from './pages/trabajadores/PaginaDetalleTrabajador';
import PaginaEquipos from './pages/equipos/PaginaEquipos';
import PaginaDetalleEquipo from './pages/equipos/PaginaDetalleEquipo';
import PaginaSupervisores from './pages/supervisores/PaginaSupervisores';
import PaginaDetalleSupervisor from './pages/supervisores/PaginaDetalleSupervisor';
import PaginaSucursales from './pages/sucursales/PaginaSucursales';
import PaginaDetalleSucursal from './pages/sucursales/PaginaDetalleSucursal';
import PaginaMatrizIpc from './pages/matriz-ipc/PaginaMatrizIpc';
import PaginaEscanerQr from './pages/escaner/PaginaEscanerQr';
import PaginaAmonestaciones from './pages/amonestaciones/PaginaAmonestaciones';
import PaginaInspecciones from './pages/inspecciones/PaginaInspecciones';
import PaginaDetalleInspeccion from './pages/inspecciones/PaginaDetalleInspeccion';
import PaginaReportes from './pages/reportes/PaginaReportes';
import PaginaEmergencia from './pages/trabajadores/PaginaEmergencia';

export default function App() {
  const { cargarSesion } = useAuthStore();

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PaginaLogin />} />

        <Route element={<Layout />}>
          {/* Dashboard es para todos */}
          <Route element={<RutaProtegida />}>
            <Route path="/" element={<PaginaDashboard />} />
            <Route path="/reportes" element={<PaginaReportes />} />
          </Route>

          {/* Rutas de Operación y Configuración: COORDINADOR y SUPERVISOR */}
          <Route element={<RutaProtegida rolesPermitidos={['COORDINADOR', 'SUPERVISOR']} />}>
            {/* Trabajadores */}
            <Route path="/trabajadores" element={<PaginaTrabajadores />} />
            <Route path="/trabajadores/:id" element={<PaginaDetalleTrabajador />} />
            <Route path="/emergencia/:trabajadorId" element={<PaginaEmergencia />} />

            {/* Equipos */}
            <Route path="/equipos" element={<PaginaEquipos />} />
            <Route path="/equipos/:id" element={<PaginaDetalleEquipo />} />

            {/* Sucursales (Solo Coordinador en el backend, pero pueden ver lista) */}
            <Route path="/sucursales" element={<PaginaSucursales />} />
            <Route path="/sucursales/:id" element={<PaginaDetalleSucursal />} />

            {/* Lector QR */}
            <Route path="/escaner" element={<PaginaEscanerQr />} />

            {/* Inspecciones y Amonestaciones */}
            <Route path="/inspecciones" element={<PaginaInspecciones />} />
            <Route path="/inspecciones/:id" element={<PaginaDetalleInspeccion />} />
            <Route path="/amonestaciones" element={<PaginaAmonestaciones />} />
          </Route>

          {/* Administración: Solo COORDINADOR */}
          <Route element={<RutaProtegida rolesPermitidos={['COORDINADOR']} />}>
            {/* Supervisores */}
            <Route path="/supervisores" element={<PaginaSupervisores />} />
            <Route path="/supervisores/:id" element={<PaginaDetalleSupervisor />} />

            {/* Matriz IPC */}
            <Route path="/matriz-ipc" element={<PaginaMatrizIpc />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProximoModulo({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--color-fondo-card)' }}>
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-xl font-bold mb-2">{titulo}</h2>
      <p style={{ color: 'var(--color-texto-secundario)' }}>Este módulo está en desarrollo — Fase 2</p>
    </div>
  );
}
