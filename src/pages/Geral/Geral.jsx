import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Clock3, CreditCard, Landmark, Plus, TrendingUp, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useGastos, useProximosPagamentos } from '../../hooks/useGastos';
import { useEntradas } from '../../hooks/useEntradas';
import { useHistoricoFinanceiro } from '../../hooks/useHistoricoFinanceiro';
import { useCartao } from '../../contexts/CartaoContext';
import { usePerfil } from '../../contexts/PerfilContext';
import * as entradasService from '../../services/entradasService';
import {
  dataCurta,
  dataDiaMes,
  dataPadrao,
  moeda,
  parseValor,
  periodoDaFatura,
  rotuloTipo,
  statusDoGasto,
  textoPrazo,
} from '../../lib/format';
import './Geral.css';

const soma = (lista) => lista.reduce((total, item) => total + Number(item.valor), 0);

const FORMAS = [
  { id: 'debito', titulo: 'Gastos no débito' },
  { id: 'credito', titulo: 'Gastos no crédito' },
  { id: 'manual', titulo: 'Pagos manualmente' },
];

export default function Geral() {
  const { mes } = useMes();
  const { cartao } = useCartao();
  const { avisar } = useToast();
  const { isAdmin, usuarios, alvoAdmin, setAlvoAdmin, userIdVisualizado } = usePerfil();
  const { gastos, carregando: carregandoGastos, erro: erroGastos } = useGastos(mes, userIdVisualizado, isAdmin);
  const { entradas, carregando: carregandoEntradas, erro: erroEntradas, recarregar } = useEntradas(mes, userIdVisualizado);
  const { proximos, erro: erroProximos } = useProximosPagamentos(userIdVisualizado, isAdmin);
  const { meses: historico, carregando: carregandoHistorico, erro: erroHistorico, recarregar: recarregarHistorico } = useHistoricoFinanceiro(mes, userIdVisualizado);

  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const { formas, resumo } = useMemo(() => {
    const abertos = gastos.filter((g) => !g.pago);
    const pagos = gastos.filter((g) => g.pago);
    const entrou = soma(entradas);

    const totais = (lista) => {
      const pago = soma(lista.filter((g) => g.pago));
      const total = soma(lista);
      return { lista, total, pago, aPagar: total - pago };
    };

    return {
      formas: FORMAS.map((forma) => ({
        ...forma,
        ...totais(gastos.filter((g) => g.forma_pagamento === forma.id)),
      })),
      resumo: {
        entrou,
        total: soma(gastos),
        pago: soma(pagos),
        divida: soma(abertos),
        qtdAbertos: abertos.length,
        qtdAtrasados: abertos.filter((g) => statusDoGasto(g) === 'atrasado').length,
        saldo: entrou - soma(gastos),
        percentual: gastos.length ? Math.round((pagos.length / gastos.length) * 100) : 0,
        qtdPagos: pagos.length,
      },
    };
  }, [gastos, entradas]);

  const erro = erroGastos || erroEntradas || erroProximos || erroHistorico;
  const carregando = carregandoGastos || carregandoEntradas;

  function abrirModal() {
    setDescricao('');
    setValor('');
    setData(dataPadrao(mes));
    setErroForm('');
    setModalAberto(true);
  }

  async function salvarEntrada(e) {
    e.preventDefault();
    const valorNumerico = parseValor(valor);
    if (!descricao.trim()) return setErroForm('Informe de onde veio o dinheiro.');
    if (!(valorNumerico > 0)) return setErroForm('Informe um valor maior que zero.');
    if (!data) return setErroForm('Informe a data da entrada.');

    setSalvando(true);
    setErroForm('');
    try {
      await entradasService.criar({
        descricao: descricao.trim(),
        valor: valorNumerico,
        data_entrada: data,
      });
      setModalAberto(false);
      avisar('Entrada registrada');
      recarregar();
      recarregarHistorico();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirEntrada(entrada) {
    if (!window.confirm(`Excluir a entrada "${entrada.descricao}"?`)) return;
    try {
      await entradasService.excluir(entrada.id);
      avisar('Entrada excluída');
      recarregar();
      recarregarHistorico();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  const [debito, credito] = formas;
  const periodo = periodoDaFatura(mes, cartao);
  const maiorValorDoGrafico = Math.max(1, ...historico.flatMap((item) => [item.entradas, item.gastos]));

  return (
    <div className="geral">
      <PageHeader titulo={isAdmin ? 'Visão administrativa' : 'Geral'} descricao={isAdmin ? 'Consulta em modo somente leitura.' : 'Tudo do seu mês, em detalhe.'}>
        {isAdmin && (
          <label className="geral__seletor-usuario">
            <span>Visualizar</span>
            <select value={alvoAdmin} onChange={(event) => setAlvoAdmin(event.target.value)}>
              <option value="todos">Usuário G e T</option>
              {usuarios.map((usuario) => <option value={usuario.id} key={usuario.id}>{usuario.nome || (usuario.papel === 'usuario_g' ? 'Usuário G' : 'Usuário T')}</option>)}
            </select>
          </label>
        )}
      </PageHeader>

      {erro && <p className="aviso-erro geral__erro">Não foi possível carregar os dados: {erro}</p>}

      <section className="geral__cards" aria-busy={carregando}>
        <StatCard
          rotulo="Entrou no mês"
          valor={moeda(resumo.entrou)}
          detalhe={`${entradas.length} ${entradas.length === 1 ? 'entrada' : 'entradas'}`}
          tom="positivo"
          icone={TrendingUp}
        />
        <StatCard
          rotulo="Já pago"
          valor={moeda(resumo.pago)}
          detalhe={`${resumo.qtdPagos} de ${gastos.length} contas`}
          icone={CircleCheck}
        />
        <StatCard
          rotulo="Em dívida"
          valor={moeda(resumo.divida)}
          detalhe={
            resumo.qtdAbertos === 0
              ? 'Nenhuma conta em aberto'
              : resumo.qtdAtrasados > 0
                ? `${resumo.qtdAbertos} em aberto, ${resumo.qtdAtrasados} atrasada${resumo.qtdAtrasados > 1 ? 's' : ''}`
                : `${resumo.qtdAbertos} em aberto, nenhuma atrasada`
          }
          tom={resumo.qtdAtrasados > 0 ? 'perigo' : 'alerta'}
          icone={Clock3}
        />
        <StatCard
          rotulo="Gastos no débito"
          valor={moeda(debito.total)}
          detalhe={
            debito.lista.length === 0
              ? 'Nenhuma compra no débito'
              : `${debito.lista.length} ${debito.lista.length === 1 ? 'compra' : 'compras'} · já pagas`
          }
          icone={Landmark}
        />
        <StatCard
          rotulo="Gastos no crédito"
          valor={moeda(credito.total)}
          detalhe={
            credito.lista.length === 0
              ? 'Nenhuma compra no cartão'
              : isAdmin
                ? `${credito.aPagar > 0 ? `${moeda(credito.aPagar)} em aberto` : 'Faturas pagas'}`
                : `${credito.aPagar > 0 ? `${moeda(credito.aPagar)} em aberto` : 'Fatura paga'} · ${dataDiaMes(periodo.inicio)} a ${dataDiaMes(periodo.fim)}`
          }
          tom={credito.aPagar > 0 ? 'alerta' : 'neutro'}
          icone={CreditCard}
        />
      </section>

      <section className="painel geral__grafico" aria-busy={carregandoHistorico}>
        <header className="geral__grafico-topo">
          <div>
            <h2>Entradas e gastos por mês</h2>
            <p>Todos os meses registrados aparecem aqui; role para ver períodos antigos.</p>
          </div>
          <div className="geral__legenda" aria-label="Legenda do gráfico">
            <span><i className="geral__legenda-entrada" />Entradas</span>
            <span><i className="geral__legenda-gasto" />Gastos</span>
          </div>
        </header>
        <div className="geral__barras-rolagem">
          <div className="geral__barras" style={{ '--quantidade': Math.max(6, historico.length) }} role="img" aria-label="Gráfico de entradas e gastos por mês">
            {historico.map((item) => (
              <div className="geral__grupo-barra" key={item.referencia}>
                <div className="geral__colunas-grafico">
                  <span className="geral__barra-grafico geral__barra-grafico--entrada" title={`${item.rotulo}: ${moeda(item.entradas)} em entradas`} style={{ height: `${(item.entradas / maiorValorDoGrafico) * 100}%` }} />
                  <span className="geral__barra-grafico geral__barra-grafico--gasto" title={`${item.rotulo}: ${moeda(item.gastos)} em gastos`} style={{ height: `${(item.gastos / maiorValorDoGrafico) * 100}%` }} />
                </div>
                <span className="geral__rotulo-mes">{item.rotulo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="geral__colunas">
        <section className="painel geral__lista">
          <header className="geral__lista-topo">
            <h2>Próximos pagamentos</h2>
            {!isAdmin && <Link to="/pagamentos" className="geral__link">Confirmar pagamento</Link>}
          </header>
          {proximos.length === 0 ? (
            <EmptyState titulo="Nada a pagar" descricao="Todas as contas cadastradas estão pagas." />
          ) : (
            <ul>
              {proximos.map((g) => (
                <li key={g.id} className="geral__item">
                  <div className="geral__item-info">
                    <strong>{g.nome}</strong>
                    <small>{rotuloTipo(g)} · {dataCurta(g.data_pagamento)} · {textoPrazo(g.data_pagamento)}</small>
                  </div>
                  <StatusBadge status={statusDoGasto(g)} />
                  <span className="numero geral__item-valor">{moeda(g.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="painel geral__lista">
          <header className="geral__lista-topo">
            <div>
              <h2>Valores adicionados</h2>
              <p className="geral__sub">Dinheiro que entrou em {entradas.length === 1 ? '1 lançamento' : `${entradas.length} lançamentos`}</p>
            </div>
            {!isAdmin && <button type="button" className="btn btn--secundario btn--pequeno" onClick={abrirModal}>
              <Plus size={16} aria-hidden="true" />
              Registrar entrada
            </button>}
          </header>
          {entradas.length === 0 ? (
            <EmptyState
              titulo="Nenhuma entrada neste mês"
              descricao="Registre salário, vendas ou qualquer dinheiro que entrou."
            >
              {!isAdmin &&
              <button type="button" className="btn btn--primario btn--pequeno" onClick={abrirModal}>
                Registrar entrada
              </button>}
            </EmptyState>
          ) : (
            <ul>
              {entradas.map((e) => (
                <li key={e.id} className="geral__item">
                  <div className="geral__item-info">
                    <strong>{e.descricao}</strong>
                    <small>Recebido em {dataCurta(e.data_entrada)}</small>
                  </div>
                  <span className="numero geral__item-valor geral__item-valor--entrada">
                    {moeda(e.valor)}
                  </span>
                  {!isAdmin && <button
                    type="button"
                    className="btn btn--perigo btn--icone"
                    onClick={() => excluirEntrada(e)}
                    aria-label={`Excluir entrada ${e.descricao}`}
                  >
                    <Trash2 size={16} />
                  </button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!isAdmin && <Modal aberto={modalAberto} titulo="Registrar entrada" onFechar={() => setModalAberto(false)}>
        <form className="geral__form" onSubmit={salvarEntrada} noValidate>
          <label className="campo">
            <span>Descrição</span>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Salário, Freela"
              maxLength={80}
            />
          </label>
          <label className="campo">
            <span>Valor (R$)</span>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </label>
          <label className="campo">
            <span>Data da entrada</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          {erroForm && <p className="aviso-erro">{erroForm}</p>}
          <button type="submit" className="btn btn--primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Registrar entrada'}
          </button>
        </form>
      </Modal>}
    </div>
  );
}
