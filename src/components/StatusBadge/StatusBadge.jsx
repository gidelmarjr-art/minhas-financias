import './StatusBadge.css';

const ROTULOS = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado' };

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-badge--${status}`}>{ROTULOS[status]}</span>;
}
