import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BadgeCheck, CalendarClock, ChartNoAxesCombined, LayoutDashboard, LogOut, Moon, ReceiptText, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePerfil } from '../../contexts/PerfilContext';
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
  const { isAdmin, perfil } = usePerfil();
  const [temaClaro, setTemaClaro] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    const chave = `tema:${perfil.id}`;
    const salvo = localStorage.getItem(chave);
    // Júnior inicia no escuro; Thiago e Admin, no claro. A preferência fica individual.
    setTemaClaro(salvo ? salvo === 'claro' : perfil.papel !== 'usuario_g');
  }, [perfil]);

  useEffect(() => {
    if (!perfil) return;
    document.documentElement.dataset.theme = temaClaro ? 'light' : 'dark';
    localStorage.setItem(`tema:${perfil.id}`, temaClaro ? 'claro' : 'escuro');
  }, [temaClaro, perfil]);

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <span className="sidebar__logo" aria-hidden="true">
          M
        </span>
        <span className="sidebar__nome">Minhas Finanças</span>
      </div>

      <nav className="sidebar__nav" aria-label="Principal">
        {(isAdmin ? ITENS.filter((item) => item.to === '/geral') : ITENS).map(({ to, rotulo, curto, icone: Icone }) => (
          <NavLink key={to} to={to} className="sidebar__link">
            <Icone size={20} aria-hidden="true" />
            <span className="sidebar__rotulo-longo">{rotulo}</span>
            <span className="sidebar__rotulo-curto">{curto}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__rodape">
        <button
          type="button"
          className="sidebar__tema"
          onClick={() => setTemaClaro((temaAtual) => !temaAtual)}
          aria-label={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'}
          title={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'}
        >
          {temaClaro ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          <span>{temaClaro ? 'Modo escuro' : 'Modo claro'}</span>
        </button>
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
