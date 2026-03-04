import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

interface PropsRutaProtegida {
  rolesPermitidos?: string[];
}

export default function RutaProtegida({ rolesPermitidos }: PropsRutaProtegida) {
  const { usuario, token } = useAuthStore();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    // Si es jefatura intentando entrar a zona de trabajo, mandarlo a dashboard
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
