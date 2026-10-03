import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './RotaProtegida.css';

export default function RotaProtegida() {
  const { sessao, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="rota-protegida__carregando" role="status" aria-label="Carregando">
        <span className="rota-protegida__spinner" />
      </div>
    );
  }
  if (!sessao) return <Navigate to="/login" replace />;
  return <Outlet />;
}
