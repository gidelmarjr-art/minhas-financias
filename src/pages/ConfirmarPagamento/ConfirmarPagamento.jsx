import { useMemo, useState } from 'react';
import { CreditCard, Undo2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import ConfirmarPagamentoModal from '../../components/ConfirmarPagamentoModal/ConfirmarPagamentoModal';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useGastos } from '../../hooks/useGastos';
import * as gastosService from '../../services/gastosService';
import { useCartao } from '../../contexts/CartaoContext';
import {
  dataCurta,
  dataDoMes,
  moeda,
  periodoDaFatura,
  rotuloTipo,
  statusDoGasto,
  textoPrazo,
} from '../../lib/format';
import './ConfirmarPagamento.css';

const soma = (lista) => lista.reduce((total, g) => total + Number(g.valor), 0);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function detalhePago(g) {
  if (g.forma_pagamento === 'debito') return `Débito em ${dataCurta(g.data_pago)} · ${g.banco}`;
  if (g.forma_pagamento === 'credito') return `Fatura paga em ${dataCurta(g.data_pago)} · ${g.banco}`;
  return `Pago em ${dataCurta(g.data_pago)} · ${g.banco}`;
}

export default function ConfirmarPagamento() {
  const { mes } = useMes();
  const { cartao, abrirConfig } = useCartao();
  const { avisar } = useToast();
  const { gastos, carregando, erro, recarregar } = useGastos(mes);
  const [aba, setAba] = useState('pendentes');
  const [selecionado, setSelecionado] = useState(null);
  const [pagandoFatura, setPagandoFatura] = useState(false);

  // Crédito vira uma fatura única; débito já nasce pago; o resto o usuário confirma um a um.
  const { fatura, manuais, pagos } = useMemo(
    () => ({
      fatura: gastos.filter((g) => !g.pago && g.forma_pagamento === 'credito'),
      manuais: gastos.filter((g) => !g.pago && g.forma_pagamento !== 'credito'),
      pagos: gastos
        .filter((g) => g.pago)
        .sort((a, b) => (b.data_pago || '').localeCompare(a.data_pago || '')),
    }),
    [gastos],
  );

  const totalFatura = soma(fatura);
  const totalManuais = soma(manuais);
  const totalPago = soma(pagos);
  const qtdPendentes = fatura.length + manuais.length;
  const periodo = periodoDaFatura(mes, cartao);
  const vencimentoFatura = dataDoMes(mes, cartao.dia_vencimento);

  async function confirmarUma(dados) {
    await gastosService.confirmarPagamento(selecionado.id, dados);
    setSelecionado(null);
    avisar('Pagamento confirmado');
    recarregar();
  }

  async function pagarFatura(dados) {
    await gastosService.confirmarPagamentoEmLote(
      fatura.map((g) => g.id),
      dados,
    );
    setPagandoFatura(false);
    avisar(`Cartão de crédito pago: ${plural(fatura.length, 'compra', 'compras')}`);
    recarregar();
  }

  async function desfazer(gasto) {
    if (!window.confirm(`Voltar "${gasto.nome}" para pendente?`)) return;
    try {
      await gastosService.desfazerPagamento(gasto.id);
      avisar('Pagamento desfeito');
      recarregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  return (
    <div className="pagamentos">
      <PageHeader
        titulo="Confirmar pagamento"
        descricao="Pague a fatura do cartão de uma vez e confirme as outras contas uma a uma."
      />

      <section className="pagamentos__resumo">
        <div className="painel pagamentos__bloco">
          <span>A pagar</span>
          <strong className="numero">{moeda(totalFatura + totalManuais)}</strong>
          <small>
            {moeda(totalFatura)} no cartão · {moeda(totalManuais)} em contas
          </small>
        </div>
        <div className="painel pagamentos__bloco pagamentos__bloco--pago">
          <span>Já pago</span>
          <strong className="numero">{moeda(totalPago)}</strong>
          <small>{plural(pagos.length, 'conta', 'contas')}</small>
        </div>
      </section>

      <div className="pagamentos__abas" role="tablist" aria-label="Situação das contas">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'pendentes'}
          className={aba === 'pendentes' ? 'ativa' : ''}
          onClick={() => setAba('pendentes')}
        >
          Pendentes ({qtdPendentes})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'pagos'}
          className={aba === 'pagos' ? 'ativa' : ''}
          onClick={() => setAba('pagos')}
        >
          Pagos ({pagos.length})
        </button>
      </div>

      {erro && <p className="aviso-erro">Não foi possível carregar as contas: {erro}</p>}

      {aba === 'pendentes' && (
        <>
          {fatura.length > 0 && (
            <section className="painel pagamentos__fatura" aria-busy={carregando}>
              <header className="pagamentos__fatura-topo">
                <span className="pagamentos__fatura-icone" aria-hidden="true">
                  <CreditCard size={22} />
                </span>
                <div className="pagamentos__fatura-texto">
                  <h2>Cartão de crédito</h2>
                  <p>
                    {plural(fatura.length, 'compra', 'compras')} · compras de {dataCurta(periodo.inicio)} a{' '}
                    {dataCurta(periodo.fim)}
                  </p>
                  <p>
                    Vence em {dataCurta(vencimentoFatura)} ·{' '}
                    <button type="button" className="pagamentos__link" onClick={abrirConfig}>
                      ajustar cartão
                    </button>
                  </p>
                </div>
                <div className="pagamentos__fatura-total">
                  <strong className="numero">{moeda(totalFatura)}</strong>
                  <button
                    type="button"
                    className="btn btn--primario"
                    onClick={() => setPagandoFatura(true)}
                  >
                    Pagar cartão de crédito
                  </button>
                </div>
              </header>

              <details className="pagamentos__detalhes">
                <summary>Ver as compras da fatura</summary>
                <ul>
                  {fatura.map((g) => (
                    <li key={g.id} className="pagamentos__item pagamentos__item--compacto">
                      <div className="pagamentos__info">
                        <strong>{g.nome}</strong>
                        <small>
                          {rotuloTipo(g)} · Compra em {dataCurta(g.data_compra ?? g.data_pagamento)}
                        </small>
                      </div>
                      <span className="numero pagamentos__valor">{moeda(g.valor)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          )}

          {manuais.length > 0 && (
            <section className="painel pagamentos__lista" aria-busy={carregando}>
              <h2 className="pagamentos__titulo-secao">Contas para pagar manualmente</h2>
              <ul>
                {manuais.map((g) => (
                  <li key={g.id} className="pagamentos__item">
                    <div className="pagamentos__info">
                      <strong>{g.nome}</strong>
                      <small>
                        {rotuloTipo(g)} · {dataCurta(g.data_pagamento)} · {textoPrazo(g.data_pagamento)}
                      </small>
                    </div>
                    <StatusBadge status={statusDoGasto(g)} />
                    <span className="numero pagamentos__valor">{moeda(g.valor)}</span>
                    <button
                      type="button"
                      className="btn btn--primario btn--pequeno"
                      onClick={() => setSelecionado(g)}
                    >
                      Confirmar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!erro && !carregando && qtdPendentes === 0 && (
            <section className="painel pagamentos__lista">
              <EmptyState
                titulo="Nenhuma conta pendente"
                descricao="Tudo em dia neste mês, ou ainda não há contas cadastradas."
              />
            </section>
          )}
        </>
      )}

      {aba === 'pagos' && (
        <section className="painel pagamentos__lista" aria-busy={carregando}>
          {!erro && !carregando && pagos.length === 0 && (
            <EmptyState
              titulo="Nenhum pagamento confirmado"
              descricao="Os pagamentos confirmados e as compras no débito aparecem aqui."
            />
          )}
          <ul>
            {pagos.map((g) => (
              <li key={g.id} className="pagamentos__item">
                <div className="pagamentos__info">
                  <strong>{g.nome}</strong>
                  <small>
                    {rotuloTipo(g)} · {detalhePago(g)}
                  </small>
                </div>
                <StatusBadge status="pago" />
                <span className="numero pagamentos__valor">{moeda(g.valor)}</span>
                <button
                  type="button"
                  className="btn btn--secundario btn--pequeno"
                  onClick={() => desfazer(g)}
                >
                  <Undo2 size={15} aria-hidden="true" />
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmarPagamentoModal
        aberto={Boolean(selecionado)}
        resumo={
          selecionado && {
            titulo: selecionado.nome,
            valor: moeda(selecionado.valor),
            detalhe: `Vencimento em ${dataCurta(selecionado.data_pagamento)}`,
          }
        }
        onFechar={() => setSelecionado(null)}
        onConfirmar={confirmarUma}
      />

      <ConfirmarPagamentoModal
        aberto={pagandoFatura}
        titulo="Pagar cartão de crédito"
        textoBotao="Pagar fatura"
        resumo={{
          titulo: 'Fatura do cartão de crédito',
          valor: moeda(totalFatura),
          detalhe: `Compras de ${dataCurta(periodo.inicio)} a ${dataCurta(periodo.fim)} · ${plural(fatura.length, 'compra será marcada', 'compras serão marcadas')} como paga${fatura.length === 1 ? '' : 's'}`,
        }}
        onFechar={() => setPagandoFatura(false)}
        onConfirmar={pagarFatura}
      />
    </div>
  );
}
