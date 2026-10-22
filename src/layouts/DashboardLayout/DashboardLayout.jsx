import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const { pathname } = useLocation();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-layout__conteudo">
        {/* a chave refaz o elemento a cada rota, para a página entrar com um fade curto */}
        <div className="dashboard-layout__pagina" key={pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
