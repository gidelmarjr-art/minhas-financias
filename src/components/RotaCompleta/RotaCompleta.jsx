import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/** Barra o acesso de quem é só da visão geral: volta para a aba Geral. */
export default function RotaCompleta() {
  const { somenteGeral } = useAuth();
  if (somenteGeral) return <Navigate to="/geral" replace />;
  return <Outlet />;
}
