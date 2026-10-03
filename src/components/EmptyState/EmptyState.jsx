import './EmptyState.css';

export default function EmptyState({ titulo, descricao, children }) {
  return (
    <div className="empty-state">
      <strong>{titulo}</strong>
      {descricao && <p>{descricao}</p>}
      {children}
    </div>
  );
}
