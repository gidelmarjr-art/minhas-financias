import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MesProvider } from './contexts/MesContext';
import { ToastProvider } from './components/Toast/Toast';
import RotaProtegida from './components/RotaProtegida/RotaProtegida';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Login from './pages/Login/Login';
import Geral from './pages/Geral/Geral';
import CadastroGastos from './pages/CadastroGastos/CadastroGastos';
import ConfirmarPagamento from './pages/ConfirmarPagamento/ConfirmarPagamento';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MesProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RotaProtegida />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/geral" element={<Geral />} />
                  <Route path="/gastos" element={<CadastroGastos />} />
                  <Route path="/pagamentos" element={<ConfirmarPagamento />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/geral" replace />} />
            </Routes>
          </ToastProvider>
        </MesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
