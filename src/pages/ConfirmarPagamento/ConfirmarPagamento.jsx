import { useMemo, useState } from 'react';
import { Undo2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import ConfirmarPagamentoModal from '../../components/ConfirmarPagamentoModal/ConfirmarPagamentoModal';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useGastos } from '../../hooks/useGastos';
import * as gastosService from '../../services/gastosService';
import { dataCurta, moeda, statusDoGasto, textoPrazo } from '../../lib/format';
import './ConfirmarPagamento.css';

export default function ConfirmarPagamento() {
  const { mes } = useMes();
  const { avisar } = useToast();
  const { gastos, carregando, erro, recarregar } = useGastos(mes);
  const [aba, setAba] = useState('pendentes');
  const [selecionado, setSelecionado] = useState(null);

  const { pendentes, pagos } = useMemo(
    () => ({
      pendentes: gastos.filter((g) => !g.pago),
      pagos: gastos
        .filter((g) => g.pago)
        .sort((a, b) => (b.data_pago || '').localeCompare(a.data_pago || '')),
    }),
    [gastos],
  );

  const totalPendente = pendentes.reduce((t, g) => t + Number(g.valor), 0);
  const totalPago = pagos.reduce((t, g) => t + Number(g.valor), 0);
  const lista = aba === 'pendentes' ? pendentes : pagos;

  async function confirmar(gasto, dados) {
    await gastosService.confirmarPagamento(gasto.id, dados);
    setSelecionado(null);
    avisar('Pagamento confirmado');
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
        descricao="Marque como pago informando a data e o banco usado."
      />

      <section className="pagamentos__resumo">
        <div className="painel pagamentos__bloco">
          <span>A pagar</span>
          <strong className="numero">{moeda(totalPendente)}</strong>
        </div>
        <div className="painel pagamentos__bloco pagamentos__bloco--pago">
          <span>Já pago</span>
          <strong className="numero">{moeda(totalPago)}</strong>
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
          Pendentes ({pendentes.length})
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

      <section className="painel pagamentos__lista" aria-busy={carregando}>
        {erro && <p className="aviso-erro">Não foi possível carregar as contas: {erro}</p>}

        {!erro && !carregando && lista.length === 0 && (
          <EmptyState
            titulo={aba === 'pendentes' ? 'Nenhuma conta pendente' : 'Nenhum pagamento confirmado'}
            descricao={
              aba === 'pendentes'
                ? 'Tudo em dia neste mês, ou ainda não há contas cadastradas.'
                : 'Os pagamentos confirmados aparecem aqui.'
            }
          />
        )}

        <ul>
          {lista.map((g) => (
            <li key={g.id} className="pagamentos__item">
              <div className="pagamentos__info">
                <strong>{g.nome}</strong>
                {g.pago ? (
                  <small>
                    Pago em {dataCurta(g.data_pago)} · {g.banco}
                  </small>
                ) : (
                  <small>
                    {dataCurta(g.data_pagamento)} · {textoPrazo(g.data_pagamento)}
                  </small>
                )}
              </div>
              <StatusBadge status={statusDoGasto(g)} />
              <span className="numero pagamentos__valor">{moeda(g.valor)}</span>
              {g.pago ? (
                <button
                  type="button"
                  className="btn btn--secundario btn--pequeno"
                  onClick={() => desfazer(g)}
                >
                  <Undo2 size={15} aria-hidden="true" />
                  Desfazer
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primario btn--pequeno"
                  onClick={() => setSelecionado(g)}
                >
                  Confirmar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <ConfirmarPagamentoModal
        gasto={selecionado}
        onFechar={() => setSelecionado(null)}
        onConfirmar={confirmar}
      />
    </div>
  );
}
