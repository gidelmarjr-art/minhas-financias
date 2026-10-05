import { Navigate, Outlet } from 'react-router-dom';
import { usePerfil } from '../../contexts/PerfilContext';

/** Impede que a conta Admin abra telas que alteram dados, mesmo digitando a URL. */
export default function RotaUsuarioComum() {
  const { isAdmin, carregandoPerfil } = usePerfil();
  if (carregandoPerfil) return null;
  return isAdmin ? <Navigate to="/geral" replace /> : <Outlet />;
}
