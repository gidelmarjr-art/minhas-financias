import MiniGrafico from '../MiniGrafico/MiniGrafico';
import ValorAnimado from '../ValorAnimado/ValorAnimado';
import './StatCard.css';

/**
 * Cartão de número.
 * - `numero`: valor que sobe até o final (e usa `formatar`); sem ele, mostra `valor` como texto.
 * - `serie` + `grafico` ('barras' | 'linha'): desenho em miniatura ao lado do valor.
 * - `destaque`: cartão em verde-sálvia; `vivo` acende o pontinho que pulsa.
 * - `indice`: posição na sequência de entrada (cada cartão aparece um pouco depois do anterior).
 */
export default function StatCard({
  rotulo,
  valor,
  numero,
  formatar,
  detalhe,
  tom = 'neutro',
  icone: Icone,
  serie,
  grafico = 'barras',
  destaque = false,
  vivo = false,
  indice = 0,
}) {
  return (
    <article
      className={`stat-card stat-card--${tom} ${destaque ? 'stat-card--destaque' : ''}`}
      style={{ '--i': indice, '--atraso': `${indice * 90 + 250}ms` }}
    >
      <div className="stat-card__topo">
        <span className="stat-card__rotulo">
          {vivo && <span className="stat-card__vivo" aria-hidden="true" />}
          {rotulo}
        </span>
        {Icone && (
          <span className="stat-card__icone" aria-hidden="true">
            <Icone size={18} />
          </span>
        )}
      </div>

      <div className="stat-card__corpo">
        <div className="stat-card__texto">
          <strong className="stat-card__valor numero">
            {numero !== undefined ? <ValorAnimado valor={numero} formatar={formatar} /> : valor}
          </strong>
          {detalhe && <span className="stat-card__detalhe">{detalhe}</span>}
        </div>
        {serie && <MiniGrafico tipo={grafico} serie={serie} />}
      </div>
    </article>
  );
}
