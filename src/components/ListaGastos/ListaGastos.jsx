import StatusBadge from '../StatusBadge/StatusBadge';
import EmptyState from '../EmptyState/EmptyState';
import { dataCurta, moeda, statusDoGasto, textoPrazo } from '../../lib/format';
import './ListaGastos.css';

const soma = (lista) => lista.reduce((total, g) => total + Number(g.valor), 0);

function Etiqueta({ gasto }) {
  if (gasto.tipo === 'fixo') return <span className="lista-gastos__tag">Todo mês</span>;
  if (gasto.tipo === 'parcelado') {
    return (
      <span className="lista-gastos__tag">
        Parcela {gasto.parcela_numero}/{gasto.parcela_total}
      </span>
    );
  }
  return null;
}

function Detalhe({ gasto }) {
  if (gasto.pago) {
    return (
      <small>
        Vencimento {dataCurta(gasto.data_pagamento)} · Pago em {dataCurta(gasto.data_pago)} ·{' '}
        {gasto.banco}
      </small>
    );
  }
  return (
    <small>
      Vencimento {dataCurta(gasto.data_pagamento)} · {textoPrazo(gasto.data_pagamento)}
    </small>
  );
}

/**
 * Painel com uma lista de contas, totais no topo e, opcionalmente, ações por linha.
 * `renderAcoes(gasto)` devolve os botões de cada linha.
 */
export default function ListaGastos({
  titulo,
  descricao,
  gastos,
  vazio,
  vazioDescricao,
  renderAcoes,
  destaqueId,
  ocupado = false,
}) {
  const total = soma(gastos);
  const pago = soma(gastos.filter((g) => g.pago));

  return (
    <section className="painel lista-gastos" aria-busy={ocupado}>
      <header className="lista-gastos__topo">
        <div>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        <div className="lista-gastos__totais">
          <strong className="numero">{moeda(total)}</strong>
          <small>
            {gastos.length === 0
              ? 'Nenhuma conta'
              : `${moeda(pago)} pago · ${moeda(total - pago)} a pagar`}
          </small>
        </div>
      </header>

      {gastos.length === 0 ? (
        <EmptyState titulo={vazio} descricao={vazioDescricao} />
      ) : (
        <ul>
          {gastos.map((g) => (
            <li
              key={g.id}
              className={`lista-gastos__item ${destaqueId === g.id ? 'lista-gastos__item--ativo' : ''}`}
            >
              <div className="lista-gastos__info">
                <span className="lista-gastos__nome">
                  <strong>{g.nome}</strong>
                  <Etiqueta gasto={g} />
                </span>
                <Detalhe gasto={g} />
              </div>
              <StatusBadge status={statusDoGasto(g)} />
              <span className="numero lista-gastos__valor">{moeda(g.valor)}</span>
              {renderAcoes && <div className="lista-gastos__acoes">{renderAcoes(g)}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
