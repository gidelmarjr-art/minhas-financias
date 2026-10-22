import { Moon, Sun } from 'lucide-react';
import { useTema } from '../../contexts/TemaContext';
import './BotaoTema.css';

/** Alterna entre o fundo preto (padrão) e o branco. Sol = vai para o claro; lua = vai para o escuro. */
export default function BotaoTema({ className = '' }) {
  const { tema, alternar } = useTema();
  const rotulo = tema === 'escuro' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro';

  return (
    <button type="button" className={`botao-tema ${className}`} onClick={alternar} aria-label={rotulo}>
      <Sun className="botao-tema__sol" size={20} aria-hidden="true" />
      <Moon className="botao-tema__lua" size={20} aria-hidden="true" />
    </button>
  );
}
