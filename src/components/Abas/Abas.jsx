import './Abas.css';

export default function Abas({ abas, ativa, onMudar, rotulo }) {
  return (
    <div className="abas" role="tablist" aria-label={rotulo}>
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          role="tab"
          aria-selected={ativa === aba.id}
          className={ativa === aba.id ? 'abas__aba abas__aba--ativa' : 'abas__aba'}
          onClick={() => onMudar(aba.id)}
        >
          {aba.rotulo}
          {aba.contagem != null && <span className="abas__contagem">{aba.contagem}</span>}
        </button>
      ))}
    </div>
  );
}
