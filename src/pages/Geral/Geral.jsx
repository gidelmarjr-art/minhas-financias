import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Clock3, Plus, TrendingUp, Trash2, Wallet } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import ListaGastos from '../../components/ListaGastos/ListaGastos';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useGastos, useProximosPagamentos } from '../../hooks/useGastos';
import { useEntradas } from '../../hooks/useEntradas';
import * as entradasService from '../../services/entradasService';
import {
  dataCurta,
  dataPadrao,
  moeda,
  parseValor,
  rotuloTipo,
  statusDoGasto,
  textoPrazo,
} from '../../lib/format';
import './Geral.css';

const soma = (lista) => lista.reduce((total, item) => total + Number(item.valor), 0);

const TIPOS = [
  {
    id: 'fixo',
    titulo: 'Gastos fixos',
    descricao: 'Repetem todo mês',
    vazio: 'Nenhum gasto fixo neste mês',
    vazioDescricao: 'Cadastre em Cadastro de gastos → Gastos fixos.',
  },
  {
    id: 'variavel',
    titulo: 'Gastos variáveis',
    descricao: 'Valem só para este mês',
    vazio: 'Nenhum gasto variável neste mês',
    vazioDescricao: 'Cadastre em Cadastro de gastos → Gastos variáveis.',
  },
  {
    id: 'parcelado',
    titulo: 'Compras parceladas',
    descricao: 'Parcelas que vencem neste mês',
    vazio: 'Nenhuma parcela neste mês',
    vazioDescricao: 'Cadastre em Cadastro de gastos → Compras parceladas.',
  },
];

export default function Geral() {
  const { mes } = useMes();
  const { avisar } = useToast();
  const { gastos, carregando: carregandoGastos, erro: erroGastos } = useGastos(mes);
  const { entradas, carregando: carregandoEntradas, erro: erroEntradas, recarregar } = useEntradas(mes);
  const { proximos, erro: erroProximos } = useProximosPagamentos();

  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const { categorias, resumo } = useMemo(() => {
    const abertos = gastos.filter((g) => !g.pago);
    const pagos = gastos.filter((g) => g.pago);
    const entrou = soma(entradas);

    return {
      categorias: TIPOS.map((tipo) => {
        const lista = gastos.filter((g) => g.tipo === tipo.id);
        const pago = soma(lista.filter((g) => g.pago));
        const total = soma(lista);
        return { ...tipo, lista, total, pago, aPagar: total - pago };
      }),
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

  const erro = erroGastos || erroEntradas || erroProximos;
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
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  const fixos = categorias[0];
  const variaveis = categorias[1];
  const parcelados = categorias[2];

  return (
    <div className="geral">
      <PageHeader titulo="Geral" descricao="Tudo do seu mês, em detalhe." />

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
          rotulo="Saldo previsto"
          valor={moeda(resumo.saldo)}
          detalhe="Entradas menos todas as contas do mês"
          tom={resumo.saldo < 0 ? 'perigo' : 'positivo'}
          icone={Wallet}
        />
      </section>

      <section className="painel geral__progresso">
        <div className="geral__progresso-texto">
          <strong>Contas pagas neste mês</strong>
          <span className="numero">{resumo.percentual}%</span>
        </div>
        <div
          className="geral__barra"
          role="progressbar"
          aria-valuenow={resumo.percentual}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de contas pagas"
        >
          <span style={{ width: `${resumo.percentual}%` }} />
        </div>
      </section>

      <div className="geral__colunas">
        <section className="painel geral__resumo">
          <h2>Resumo do mês</h2>
          <div className="geral__tabela-rolagem">
            <table className="geral__tabela">
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col">Total</th>
                  <th scope="col">Pago</th>
                  <th scope="col">A pagar</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.titulo}</th>
                    <td className="numero">{moeda(c.total)}</td>
                    <td className="numero">{moeda(c.pago)}</td>
                    <td className="numero">{moeda(c.aPagar)}</td>
                  </tr>
                ))}
                <tr className="geral__tabela-total">
                  <th scope="row">Total de contas</th>
                  <td className="numero">{moeda(resumo.total)}</td>
                  <td className="numero">{moeda(resumo.pago)}</td>
                  <td className="numero">{moeda(resumo.divida)}</td>
                </tr>
                <tr className="geral__tabela-entrada">
                  <th scope="row">Valores adicionados</th>
                  <td className="numero">{moeda(resumo.entrou)}</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="painel geral__lista">
          <header className="geral__lista-topo">
            <h2>Próximos pagamentos</h2>
            <Link to="/pagamentos" className="geral__link">
              Confirmar pagamento
            </Link>
          </header>
          {proximos.length === 0 ? (
            <EmptyState titulo="Nada a pagar" descricao="Todas as contas cadastradas estão pagas." />
          ) : (
            <ul>
              {proximos.map((g) => (
                <li key={g.id} className="geral__item">
                  <div className="geral__item-info">
                    <strong>{g.nome}</strong>
                    <small>
                      {rotuloTipo(g)} · {dataCurta(g.data_pagamento)} · {textoPrazo(g.data_pagamento)}
                    </small>
                  </div>
                  <StatusBadge status={statusDoGasto(g)} />
                  <span className="numero geral__item-valor">{moeda(g.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="geral__colunas">
        <ListaGastos
          titulo={fixos.titulo}
          descricao={fixos.descricao}
          gastos={fixos.lista}
          vazio={fixos.vazio}
          vazioDescricao={fixos.vazioDescricao}
          ocupado={carregandoGastos}
        />
        <ListaGastos
          titulo={variaveis.titulo}
          descricao={variaveis.descricao}
          gastos={variaveis.lista}
          vazio={variaveis.vazio}
          vazioDescricao={variaveis.vazioDescricao}
          ocupado={carregandoGastos}
        />
      </div>

      <div className="geral__colunas">
        <ListaGastos
          titulo={parcelados.titulo}
          descricao={parcelados.descricao}
          gastos={parcelados.lista}
          vazio={parcelados.vazio}
          vazioDescricao={parcelados.vazioDescricao}
          ocupado={carregandoGastos}
        />

        <section className="painel geral__lista">
          <header className="geral__lista-topo">
            <div>
              <h2>Valores adicionados</h2>
              <p className="geral__sub">Dinheiro que entrou em {entradas.length === 1 ? '1 lançamento' : `${entradas.length} lançamentos`}</p>
            </div>
            <button type="button" className="btn btn--secundario btn--pequeno" onClick={abrirModal}>
              <Plus size={16} aria-hidden="true" />
              Registrar entrada
            </button>
          </header>
          {entradas.length === 0 ? (
            <EmptyState
              titulo="Nenhuma entrada neste mês"
              descricao="Registre salário, vendas ou qualquer dinheiro que entrou."
            >
              <button type="button" className="btn btn--primario btn--pequeno" onClick={abrirModal}>
                Registrar entrada
              </button>
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
                  <button
                    type="button"
                    className="btn btn--perigo btn--icone"
                    onClick={() => excluirEntrada(e)}
                    aria-label={`Excluir entrada ${e.descricao}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal aberto={modalAberto} titulo="Registrar entrada" onFechar={() => setModalAberto(false)}>
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
      </Modal>
    </div>
  );
}
