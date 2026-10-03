import './StatCard.css';

export default function StatCard({ rotulo, valor, detalhe, tom = 'neutro', icone: Icone }) {
  return (
    <article className={`stat-card stat-card--${tom}`}>
      <div className="stat-card__topo">
        <span className="stat-card__rotulo">{rotulo}</span>
        {Icone && (
          <span className="stat-card__icone" aria-hidden="true">
            <Icone size={18} />
          </span>
        )}
      </div>
      <strong className="stat-card__valor numero">{valor}</strong>
      {detalhe && <span className="stat-card__detalhe">{detalhe}</span>}
    </article>
  );
}
