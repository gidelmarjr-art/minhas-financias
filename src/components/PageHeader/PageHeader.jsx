import MonthPicker from '../MonthPicker/MonthPicker';
import './PageHeader.css';

export default function PageHeader({ titulo, descricao, children }) {
  return (
    <header className="page-header">
      <div className="page-header__texto">
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      <div className="page-header__acoes">
        <MonthPicker />
        {children}
      </div>
    </header>
  );
}
