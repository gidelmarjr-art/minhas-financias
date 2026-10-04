import StatusBadge from '../StatusBadge/StatusBadge';
import EmptyState from '../EmptyState/EmptyState';
import { dataCurta, moeda, statusDoGasto, textoPrazo } from '../../lib/format';
import './ListaGastos.css';

const soma = (lista) => lista.reduce((total, g) => total + Number(g.valor), 0);

function Etiquetas({ gasto, mostrarTipo, mostrarForma }) {
  let tipo = null;
  if (gasto.tipo === 'fixo') tipo = 'Todo mês';
  else if (gasto.tipo === 'parcelado') tipo = `Parcela ${gasto.parcela_numero}/${gasto.parcela_total}`;
  else if (mostrarTipo) tipo = 'Variável';

  return (
    <>
      {tipo && <span className="lista-gastos__tag">{tipo}</span>}
      {mostrarForma && gasto.forma_pagamento === 'credito' && (
        <span className="lista-gastos__tag lista-gastos__tag--credito">Crédito</span>
      )}
      {mostrarForma && gasto.forma_pagamento === 'debito' && (
        <span className="lista-gastos__tag lista-gastos__tag--debito">Débito</span>
      )}
    </>
  );
}

function Detalhe({ gasto }) {
  if (gasto.forma_pagamento === 'debito' && gasto.pago) {
    return (
      <small>
        Débito em {dataCurta(gasto.data_pago)} · {gasto.banco}
      </small>
    );
  }
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
  mostrarTipo = false,
  mostrarForma = true,
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
                  <Etiquetas gasto={g} mostrarTipo={mostrarTipo} mostrarForma={mostrarForma} />
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
