import { NavLink, useLocation } from 'react-router-dom';
import { BadgeCheck, CalendarClock, ChartNoAxesCombined, LayoutDashboard, LogOut, ReceiptText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BotaoTema from '../BotaoTema/BotaoTema';
import Marca from '../Marca/Marca';
import './Sidebar.css';

const ITENS = [
  { to: '/geral', rotulo: 'Geral', icone: LayoutDashboard },
  { to: '/gastos', rotulo: 'Cadastro de Gastos', icone: ReceiptText },
  { to: '/pagamentos', rotulo: 'Confirmar Pagamento', icone: BadgeCheck },
  { to: '/previsao-gastos', rotulo: 'Previsão de Gastos', icone: CalendarClock },
  { to: '/gastos-passados', rotulo: 'Gastos Passados', icone: ChartNoAxesCombined },
];

export default function Sidebar() {
  const { sair, sessao, somenteGeral } = useAuth();
  const { pathname } = useLocation();
  const email = sessao?.user?.email ?? '';
  // a visão geral só tem a aba Geral
  const itens = somenteGeral ? ITENS.filter((item) => item.to === '/geral') : ITENS;
  const ativo = itens.findIndex((item) => pathname.startsWith(item.to));

  return (
    <aside className="sidebar">
      <div className="sidebar__marca" aria-hidden="true">
        <Marca tamanho={36} />
      </div>

      <nav className="sidebar__nav" aria-label="Principal" style={{ '--i': Math.max(ativo, 0) }}>
        <span className="sidebar__indicador" aria-hidden="true" data-oculto={ativo < 0} />
        {itens.map(({ to, rotulo, icone: Icone }) => (
          <div className="sidebar__item" key={to}>
            <NavLink to={to} className="sidebar__link" aria-label={rotulo}>
              <Icone size={21} aria-hidden="true" />
            </NavLink>
            <span className="sidebar__dica" aria-hidden="true">
              {rotulo}
            </span>
          </div>
        ))}
      </nav>

      <div className="sidebar__rodape">
        <div className="sidebar__item">
          <button type="button" className="sidebar__acao" onClick={sair} aria-label="Sair">
            <LogOut size={20} aria-hidden="true" />
          </button>
          <span className="sidebar__dica" aria-hidden="true">
            Sair
          </span>
        </div>

        {/* O botão de tema fica logo acima do e-mail */}
        <div className="sidebar__item">
          <BotaoTema />
          <span className="sidebar__dica sidebar__dica--tema" aria-hidden="true" />
        </div>

        <div className="sidebar__item sidebar__item--email">
          <span className="sidebar__avatar" role="img" aria-label={`Conectado como ${email}`}>
            {email.charAt(0).toUpperCase() || '?'}
          </span>
          <span className="sidebar__dica" aria-hidden="true">
            {email}
          </span>
        </div>
      </div>
    </aside>
  );
}
