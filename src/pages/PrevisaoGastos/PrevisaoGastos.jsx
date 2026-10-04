import { useState } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Abas from '../../components/Abas/Abas';
import EmptyState from '../../components/EmptyState/EmptyState';
import ListaGastos from '../../components/ListaGastos/ListaGastos';
import { useMes } from '../../contexts/MesContext';
import { useGastos } from '../../hooks/useGastos';
import { rotuloMes, moeda } from '../../lib/format';
import { Wallet, CreditCard, Calendar, Repeat } from 'lucide-react';
import './PrevisaoGastos.css';

const totalizar = (itens) => itens.reduce((total, item) => total + Number(item.valor || 0), 0);

export default function PrevisaoGastos() {
  const { mes } = useMes();
  const { gastos, carregando, erro } = useGastos(mes);
  const [abaAtiva, setAbaAtiva] = useState('fixos');
  const fixos = gastos.filter((gasto) => gasto.tipo === 'fixo');
  const variaveis = gastos.filter((gasto) => gasto.tipo === 'variavel');
  const parcelados = gastos.filter((gasto) => gasto.tipo === 'parcelado');
  const cartaoCredito = gastos.filter((gasto) => gasto.forma_pagamento === 'credito');
  // Crédito é uma forma de pagamento; a fatura já está incluída nas três categorias.
  const totalGeral = totalizar(fixos) + totalizar(variaveis) + totalizar(parcelados);
  const cartoes = [
    { id: 'fixos', abaRotulo: 'Fixos', titulo: 'Gastos fixos', icone: Repeat, itens: fixos, detalhe: 'item(ns) cadastrado(s)', descricao: 'Contas recorrentes do mês', vazio: 'Nenhum gasto fixo' },
    { id: 'variaveis', abaRotulo: 'Variáveis', titulo: 'Gastos variáveis', icone: Wallet, itens: variaveis, detalhe: 'lançamento(s) no mês', descricao: 'Lançamentos avulsos do mês', vazio: 'Nenhum gasto variável' },
    { id: 'parcelados', abaRotulo: 'Parceladas', titulo: 'Compras parceladas', icone: Calendar, itens: parcelados, detalhe: 'parcela(s) no mês', descricao: 'Parcelas previstas para este mês', vazio: 'Nenhuma parcela' },
    { id: 'fatura', abaRotulo: 'Fatura', titulo: 'Fatura de crédito', icone: CreditCard, itens: cartaoCredito, detalhe: 'lançamento(s) na fatura', descricao: 'Itens que compõem a fatura', vazio: 'Nenhuma compra no crédito', mostrarTipo: true, mostrarForma: false },
  ];
  const categoriaAtiva = cartoes.find((cartao) => cartao.id === abaAtiva) ?? cartoes[0];

  return (
    <div className="previsao-gastos">
      <PageHeader titulo="Previsão de Gastos" descricao={`Projeção detalhada para ${rotuloMes(mes)}.`} />
      {erro && <p className="aviso-erro">Não foi possível carregar a previsão: {erro}</p>}
      <section className="previsao-resumo-geral painel" aria-busy={carregando}>
        <span className="previsao-resumo-geral__rotulo">Total previsto para o mês</span>
        <p className="valor-destaque">{moeda(totalGeral)}</p>
        <small>A fatura de crédito já está incluída nas categorias.</small>
      </section>
      <div className="previsao-grid" aria-busy={carregando}>
        {cartoes.map(({ id, titulo, icone: Icone, itens, detalhe }) => (
          <section className="painel previsao-card" key={id}>
            <div className="previsao-header"><Icone size={20} aria-hidden="true" /><h2>{titulo}</h2></div>
            <p className="previsao-valor numero">{moeda(totalizar(itens))}</p>
            <span className="previsao-qtd">{itens.length} {detalhe}</span>
          </section>
        ))}
      </div>
      {!carregando && gastos.length === 0 ? (
        <section className="painel previsao-vazio"><EmptyState titulo="Nenhum gasto previsto" descricao="Cadastre gastos para montar sua previsão mensal." /></section>
      ) : (
        <section className="previsao-detalhes">
          <Abas
            rotulo="Categoria da previsão"
            ativa={abaAtiva}
            onMudar={setAbaAtiva}
            abas={cartoes.map((cartao) => ({ id: cartao.id, rotulo: cartao.abaRotulo, contagem: cartao.itens.length }))}
          />
          <ListaGastos
            titulo={categoriaAtiva.titulo}
            descricao={categoriaAtiva.descricao}
            gastos={categoriaAtiva.itens}
            vazio={categoriaAtiva.vazio}
            vazioDescricao="Cadastre um gasto para vê-lo nesta previsão."
            ocupado={carregando}
            mostrarTipo={categoriaAtiva.mostrarTipo}
            mostrarForma={categoriaAtiva.mostrarForma}
          />
        </section>
      )}
    </div>
  );
}
