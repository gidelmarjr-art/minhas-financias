import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Clock3, CreditCard, Landmark, Plus, TrendingUp, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import ListaGastos from '../../components/ListaGastos/ListaGastos';
import Abas from '../../components/Abas/Abas';
import GraficoFluxo from '../../components/GraficoFluxo/GraficoFluxo';
import Medidor from '../../components/Medidor/Medidor';
import ValorAnimado from '../../components/ValorAnimado/ValorAnimado';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useGastos, useProximosPagamentos } from '../../hooks/useGastos';
import { useEntradas } from '../../hooks/useEntradas';
import { useCartao } from '../../contexts/CartaoContext';
import * as entradasService from '../../services/entradasService';
import { acumuladoPorDia, serieEmFatias } from '../../lib/series';
import {
  dataCurta,
  dataDiaMes,
  dataPadrao,
  hojeISO,
  intervaloDoMes,
  mesAtual,
  moeda,
  parseValor,
  periodoDaFatura,
  rotuloTipo,
  saudacao,
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

const FORMAS = [
  { id: 'debito', titulo: 'Gastos no débito' },
  { id: 'credito', titulo: 'Gastos no crédito' },
  { id: 'manual', titulo: 'Pagos manualmente' },
];

export default function Geral() {
  const { mes } = useMes();
  const { cartao } = useCartao();
  const { avisar } = useToast();
  const { somenteGeral } = useAuth();
  const { gastos: gastosTodos, carregando: carregandoGastos, erro: erroGastos } = useGastos(mes);
  const {
    entradas: entradasTodas,
    carregando: carregandoEntradas,
    erro: erroEntradas,
    recarregar,
  } = useEntradas(mes);
  const { proximos: proximosTodos, erro: erroProximos } = useProximosPagamentos();
  const { usuarios } = useUsuarios(somenteGeral);

  // Visão geral: "Total" mostra todo mundo junto; escolher uma pessoa separa só os dados dela.
  const [filtro, setFiltro] = useState('todos');
  const gastos = useMemo(
    () => (filtro === 'todos' ? gastosTodos : gastosTodos.filter((g) => g.user_id === filtro)),
    [gastosTodos, filtro],
  );
  const entradas = useMemo(
    () => (filtro === 'todos' ? entradasTodas : entradasTodas.filter((e) => e.user_id === filtro)),
    [entradasTodas, filtro],
  );
  const proximos = useMemo(
    () => (filtro === 'todos' ? proximosTodos : proximosTodos.filter((g) => g.user_id === filtro)),
    [proximosTodos, filtro],
  );

  // nome de cada pessoa (e uma por pessoa, com os totais, para a tabela "Por pessoa")
  const { nomes, porPessoa } = useMemo(() => {
    const nomes = new Map(usuarios.map((u) => [u.user_id, u.nome]));
    [...gastosTodos, ...entradasTodas].forEach((item) => {
      if (!nomes.has(item.user_id)) nomes.set(item.user_id, `Pessoa ${nomes.size + 1}`);
    });
    const soma = (lista) => lista.reduce((total, item) => total + Number(item.valor), 0);
    const linhas = [...nomes.entries()].map(([id, nome]) => {
      const dele = gastosTodos.filter((g) => g.user_id === id);
      const entrou = soma(entradasTodas.filter((e) => e.user_id === id));
      const contas = soma(dele);
      const pago = soma(dele.filter((g) => g.pago));
      return { id, nome, entrou, contas, pago, aPagar: contas - pago, saldo: entrou - contas };
    });
    return { nomes, porPessoa: linhas };
  }, [usuarios, gastosTodos, entradasTodas]);

  const pessoas = somenteGeral && filtro === 'todos' ? nomes : null;
  const pessoa = (id) => (pessoas?.get(id) ? ` · ${pessoas.get(id)}` : '');

  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const periodo = periodoDaFatura(mes, cartao);

  const { categorias, formas, resumo, series, fluxo } = useMemo(() => {
    const abertos = gastos.filter((g) => !g.pago);
    const pagos = gastos.filter((g) => g.pago);
    const entrou = soma(entradas);

    const totais = (lista) => {
      const pago = soma(lista.filter((g) => g.pago));
      const total = soma(lista);
      return { lista, total, pago, aPagar: total - pago };
    };

    const { inicio, fim } = intervaloDoMes(mes);
    const dias = Number(fim.slice(8, 10));
    const noVencimento = (g) => g.data_pagamento;
    const series = {
      entrou: serieEmFatias(entradas, (e) => e.data_entrada, inicio, fim),
      pago: serieEmFatias(pagos, noVencimento, inicio, fim),
      divida: serieEmFatias(abertos, noVencimento, inicio, fim),
      debito: serieEmFatias(
        gastos.filter((g) => g.forma_pagamento === 'debito'),
        noVencimento,
        inicio,
        fim,
      ),
      // no cartão, o desenho acompanha o ciclo da fatura (data da compra), não o mês do calendário
      credito: serieEmFatias(
        gastos.filter((g) => g.forma_pagamento === 'credito'),
        (g) => g.data_compra ?? g.data_pagamento,
        periodo.inicio,
        periodo.fim,
      ),
    };
    const fluxo = {
      entradas: acumuladoPorDia(entradas, (e) => e.data_entrada, dias),
      gastos: acumuladoPorDia(gastos, noVencimento, dias),
      hoje: mes === mesAtual() ? Number(hojeISO().slice(8, 10)) : null,
    };

    return {
      series,
      fluxo,
      categorias: TIPOS.map((tipo) => ({
        ...tipo,
        ...totais(gastos.filter((g) => g.tipo === tipo.id)),
      })),
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
  }, [gastos, entradas, mes, periodo.inicio, periodo.fim]);

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

  const [debito, credito] = formas;
  const fixos = categorias[0];
  const variaveis = categorias[1];
  const parcelados = categorias[2];

  return (
    <div className="geral">
      <PageHeader
        titulo={`${saudacao()}!`}
        descricao={
          somenteGeral ? 'Visão geral de todas as pessoas, somente leitura.' : 'Tudo do seu mês, em detalhe.'
        }
      >
        {somenteGeral && (
          <div className="geral__filtro">
            <Abas
              rotulo="Ver por pessoa"
              ativa={filtro}
              onMudar={setFiltro}
              abas={[
                { id: 'todos', rotulo: 'Total' },
                ...[...nomes.entries()].map(([id, nome]) => ({ id, rotulo: nome })),
              ]}
            />
          </div>
        )}
      </PageHeader>

      {erro && <p className="aviso-erro geral__erro">Não foi possível carregar os dados: {erro}</p>}

      <section className="geral__bento" aria-busy={carregando}>
        <StatCard
          indice={0}
          rotulo="Entrou no mês"
          numero={resumo.entrou}
          detalhe={`${entradas.length} ${entradas.length === 1 ? 'entrada' : 'entradas'}`}
          tom="positivo"
          icone={TrendingUp}
          serie={series.entrou}
        />
        <StatCard
          indice={1}
          rotulo="Já pago"
          numero={resumo.pago}
          detalhe={`${resumo.qtdPagos} de ${gastos.length} contas`}
          icone={CircleCheck}
          serie={series.pago}
          grafico="linha"
        />
        <StatCard
          indice={2}
          rotulo="Em dívida"
          numero={resumo.divida}
          detalhe={
            resumo.qtdAbertos === 0
              ? 'Nenhuma conta em aberto'
              : resumo.qtdAtrasados > 0
                ? `${resumo.qtdAbertos} em aberto, ${resumo.qtdAtrasados} atrasada${resumo.qtdAtrasados > 1 ? 's' : ''}`
                : `${resumo.qtdAbertos} em aberto, nenhuma atrasada`
          }
          tom={resumo.qtdAtrasados > 0 ? 'perigo' : 'alerta'}
          icone={Clock3}
          serie={series.divida}
        />
        <StatCard
          indice={3}
          destaque
          vivo={credito.aPagar > 0}
          rotulo="Gastos no crédito"
          numero={credito.total}
          detalhe={
            credito.lista.length === 0
              ? 'Nenhuma compra no cartão'
              : `${credito.aPagar > 0 ? `${moeda(credito.aPagar)} em aberto` : 'Fatura paga'} · ${dataDiaMes(periodo.inicio)} a ${dataDiaMes(periodo.fim)}`
          }
          icone={CreditCard}
          serie={series.credito}
          grafico="linha"
        />

        <section className="painel geral__fluxo" style={{ '--i': 4 }}>
          <header className="geral__fluxo-topo">
            <div>
              <h2>Fluxo do mês</h2>
              <p className="geral__sub">Total acumulado de entradas e contas, dia a dia</p>
            </div>
            <span className={`geral__chip ${resumo.saldo < 0 ? 'geral__chip--negativo' : ''}`}>
              {resumo.saldo < 0 ? 'Saldo negativo' : 'Saldo positivo'}
            </span>
          </header>
          <div className="geral__fluxo-numeros">
            <div>
              <span>
                <i className="geral__legenda geral__legenda--entradas" />
                Entradas
              </span>
              <strong className="numero">
                <ValorAnimado valor={resumo.entrou} />
              </strong>
            </div>
            <div>
              <span>
                <i className="geral__legenda geral__legenda--contas" />
                Contas
              </span>
              <strong className="numero">
                <ValorAnimado valor={resumo.total} />
              </strong>
            </div>
            <div>
              <span>Saldo previsto</span>
              <strong className={`numero ${resumo.saldo < 0 ? 'geral__negativo' : ''}`}>
                <ValorAnimado valor={resumo.saldo} />
              </strong>
            </div>
          </div>
          <GraficoFluxo entradas={fluxo.entradas} gastos={fluxo.gastos} hoje={fluxo.hoje} />
        </section>

        <section className="painel geral__medidor" style={{ '--i': 5 }}>
          <Medidor
            percentual={resumo.percentual}
            rotulo="Contas pagas neste mês"
            detalhe={`${resumo.qtdPagos} de ${gastos.length} contas`}
          >
            <dl className="geral__medidor-valores">
              <div>
                <dt>Pago</dt>
                <dd className="numero">{moeda(resumo.pago)}</dd>
              </div>
              <div>
                <dt>A pagar</dt>
                <dd className="numero">{moeda(resumo.divida)}</dd>
              </div>
            </dl>
          </Medidor>
        </section>

        <StatCard
          indice={6}
          rotulo="Gastos no débito"
          numero={debito.total}
          detalhe={
            debito.lista.length === 0
              ? 'Nenhuma compra no débito'
              : `${debito.lista.length} ${debito.lista.length === 1 ? 'compra' : 'compras'} · já pagas`
          }
          icone={Landmark}
          serie={series.debito}
        />
      </section>

      {somenteGeral && (
        <section className="painel geral__pessoas">
          <h2>Por pessoa</h2>
          <p className="geral__sub">Cada pessoa separada e, no fim, o total de todas.</p>
          <div className="geral__tabela-rolagem">
            <table className="geral__tabela">
              <thead>
                <tr>
                  <th scope="col">Pessoa</th>
                  <th scope="col">Entrou</th>
                  <th scope="col">Contas</th>
                  <th scope="col">Pago</th>
                  <th scope="col">A pagar</th>
                  <th scope="col">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {porPessoa.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">{p.nome}</th>
                    <td className="numero">{moeda(p.entrou)}</td>
                    <td className="numero">{moeda(p.contas)}</td>
                    <td className="numero">{moeda(p.pago)}</td>
                    <td className="numero">{moeda(p.aPagar)}</td>
                    <td className={`numero ${p.saldo < 0 ? 'geral__negativo' : ''}`}>{moeda(p.saldo)}</td>
                  </tr>
                ))}
                <tr className="geral__tabela-total">
                  <th scope="row">Total</th>
                  <td className="numero">{moeda(porPessoa.reduce((t, p) => t + p.entrou, 0))}</td>
                  <td className="numero">{moeda(porPessoa.reduce((t, p) => t + p.contas, 0))}</td>
                  <td className="numero">{moeda(porPessoa.reduce((t, p) => t + p.pago, 0))}</td>
                  <td className="numero">{moeda(porPessoa.reduce((t, p) => t + p.aPagar, 0))}</td>
                  <td className="numero">{moeda(porPessoa.reduce((t, p) => t + p.saldo, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                {formas.map((f) => (
                  <tr key={f.id} className="geral__tabela-forma">
                    <th scope="row">{f.titulo}</th>
                    <td className="numero">{moeda(f.total)}</td>
                    <td className="numero">{moeda(f.pago)}</td>
                    <td className="numero">{moeda(f.aPagar)}</td>
                  </tr>
                ))}
                <tr className="geral__tabela-entrada">
                  <th scope="row">Valores adicionados</th>
                  <td className="numero">{moeda(resumo.entrou)}</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr className={`geral__tabela-saldo ${resumo.saldo < 0 ? 'geral__tabela-saldo--negativo' : ''}`}>
                  <th scope="row">Saldo previsto</th>
                  <td className="numero">{moeda(resumo.saldo)}</td>
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
                <li key={g.id} className="geral__item" data-status={statusDoGasto(g)}>
                  <div className="geral__item-info">
                    <strong>{g.nome}</strong>
                    <small>
                      {rotuloTipo(g)} · {dataCurta(g.data_pagamento)} · {textoPrazo(g.data_pagamento)}
                      {pessoa(g.user_id)}
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
          pessoas={pessoas}
          ocupado={carregandoGastos}
        />
        <ListaGastos
          titulo={variaveis.titulo}
          descricao={variaveis.descricao}
          gastos={variaveis.lista}
          vazio={variaveis.vazio}
          vazioDescricao={variaveis.vazioDescricao}
          pessoas={pessoas}
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
          pessoas={pessoas}
          ocupado={carregandoGastos}
        />

        <section className="painel geral__lista">
          <header className="geral__lista-topo">
            <div>
              <h2>Valores adicionados</h2>
              <p className="geral__sub">Dinheiro que entrou em {entradas.length === 1 ? '1 lançamento' : `${entradas.length} lançamentos`}</p>
            </div>
            {!somenteGeral && (
              <button type="button" className="btn btn--secundario btn--pequeno" onClick={abrirModal}>
                <Plus size={16} aria-hidden="true" />
                Registrar entrada
              </button>
            )}
          </header>
          {entradas.length === 0 ? (
            <EmptyState
              titulo="Nenhuma entrada neste mês"
              descricao={
                somenteGeral ? 'Ninguém registrou entradas neste mês.' : 'Registre salário, vendas ou qualquer dinheiro que entrou.'
              }
            >
              {!somenteGeral && (
                <button type="button" className="btn btn--primario btn--pequeno" onClick={abrirModal}>
                  Registrar entrada
                </button>
              )}
            </EmptyState>
          ) : (
            <ul>
              {entradas.map((e) => (
                <li key={e.id} className="geral__item">
                  <div className="geral__item-info">
                    <strong>{e.descricao}</strong>
                    <small>
                      Recebido em {dataCurta(e.data_entrada)}
                      {pessoa(e.user_id)}
                    </small>
                  </div>
                  <span className="numero geral__item-valor geral__item-valor--entrada">
                    {moeda(e.valor)}
                  </span>
                  {!somenteGeral && (
                    <button
                      type="button"
                      className="btn btn--perigo btn--icone"
                      onClick={() => excluirEntrada(e)}
                      aria-label={`Excluir entrada ${e.descricao}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="geral__linha-unica">
        <ListaGastos
          titulo="Cartão de crédito"
          descricao="Tudo que está no crédito neste mês: variáveis, parceladas e fixas"
          gastos={credito.lista}
          vazio="Nenhuma compra no crédito neste mês"
          vazioDescricao="Ao cadastrar um gasto, escolha Crédito em Forma de pagamento."
          pessoas={pessoas}
          ocupado={carregandoGastos}
          mostrarTipo
          mostrarForma={false}
        />
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
