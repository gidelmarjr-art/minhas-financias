import { NavLink } from 'react-router-dom';
import { BadgeCheck, CalendarClock, ChartNoAxesCombined, LayoutDashboard, LogOut, ReceiptText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const ITENS = [
  { to: '/geral', rotulo: 'Geral', curto: 'Geral', icone: LayoutDashboard },
  { to: '/gastos', rotulo: 'Cadastro de Gastos', curto: 'Gastos', icone: ReceiptText },
  { to: '/pagamentos', rotulo: 'Confirmar Pagamento', curto: 'Pagamentos', icone: BadgeCheck },
  { to: '/previsao-gastos', rotulo: 'Previsão de Gastos', curto: 'Previsão', icone: CalendarClock },
  { to: '/gastos-passados', rotulo: 'Gastos Passados', curto: 'Histórico', icone: ChartNoAxesCombined },
];

export default function Sidebar() {
  const { sair, sessao } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <span className="sidebar__logo" aria-hidden="true">
          M
        </span>
        <span className="sidebar__nome">Minhas Finanças</span>
      </div>

      <nav className="sidebar__nav" aria-label="Principal">
        {ITENS.map(({ to, rotulo, curto, icone: Icone }) => (
          <NavLink key={to} to={to} className="sidebar__link">
            <Icone size={20} aria-hidden="true" />
            <span className="sidebar__rotulo-longo">{rotulo}</span>
            <span className="sidebar__rotulo-curto">{curto}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__rodape">
        <p className="sidebar__email" title={sessao?.user?.email}>
          {sessao?.user?.email}
        </p>
        <button type="button" className="sidebar__sair" onClick={sair}>
          <LogOut size={18} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
