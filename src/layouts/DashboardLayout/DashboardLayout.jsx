import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-layout__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
