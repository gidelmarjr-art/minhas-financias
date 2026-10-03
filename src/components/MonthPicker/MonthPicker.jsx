import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMes } from '../../contexts/MesContext';
import { mesAtual, rotuloMes } from '../../lib/format';
import './MonthPicker.css';

export default function MonthPicker() {
  const { mes, anterior, proximo, hoje } = useMes();

  return (
    <div className="month-picker">
      <button type="button" className="month-picker__seta" onClick={anterior} aria-label="Mês anterior">
        <ChevronLeft size={18} />
      </button>
      <span className="month-picker__mes" aria-live="polite">
        {rotuloMes(mes)}
      </span>
      <button type="button" className="month-picker__seta" onClick={proximo} aria-label="Próximo mês">
        <ChevronRight size={18} />
      </button>
      {mes !== mesAtual() && (
        <button type="button" className="month-picker__hoje" onClick={hoje}>
          Mês atual
        </button>
      )}
    </div>
  );
}
