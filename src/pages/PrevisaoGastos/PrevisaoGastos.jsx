import { useState } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import { useMes } from '../../contexts/MesContext';
import { useGastos } from '../../hooks/useGastos';
import { rotuloMes, formatarMoeda } from '../../lib/format';
import { Wallet, CreditCard, Calendar, Repeat } from 'lucide-react';
import './PrevisaoGastos.css';

export default function PrevisaoGastos() {
  const { mes } = useMes();
  const { gastos, carregando } = useGastos(mes);

  // Separando os gastos por tipo para a previsão do mês
  const fixos = gastos.filter((g) => g.tipo === 'fixo');
  const variaveis = gastos.filter((g) => g.tipo === 'variavel' && g.forma_pagamento !== 'credito');
  const parcelados = gastos.filter((g) => g.tipo === 'parcelado');
  const cartaoCredito = gastos.filter((g) => g.forma_pagamento === 'credito');

  const totalFixos = fixos.reduce((acc, g) => acc + Number(g.valor || 0), 0);
  const totalVariaveis = variaveis.reduce((acc, g) => acc + Number(g.valor || 0), 0);
  const totalParcelados = parcelados.reduce((acc, g) => acc + Number(g.valor || 0), 0);
  const totalCartao = cartaoCredito.reduce((acc, g) => acc + Number(g.valor || 0), 0);

  const totalGeral = totalFixos + totalVariaveis + totalParcelados + totalCartao;

  return (
    <div className="previsao-gastos">
      <PageHeader
        titulo="Previsão de Gastos"
        descricao={`Projeção e resumo detalhado para o mês de ${rotuloMes(mes)}.`}
      />

      <div className="previsao-resumo-geral painel">
        <h3>Total Previsto para o Mês</h3>
        <p className="valor-destaque">{formatarMoeda(totalGeral)}</p>
      </div>

      <div className="previsao-grid">
        {/* Gastos Fixos */}
        <div className="painel previsao-card">
          <div className="previsao-header">
            <Repeat size={20} className="text-primary" />
            <h4>Gastos Fixos</h4>
          </div>
          <p className="previsao-valor">{formatarMoeda(totalFixos)}</p>
          <span className="previsao-qtd">{fixos.length} item(ns) cadastrado(s)</span>
        </div>

        {/* Gastos Variáveis */}
        <div className="painel previsao-card">
          <div className="previsao-header">
            <Wallet size={20} />
            <h4>Gastos Variáveis</h4>
          </div>
          <p className="previsao-valor">{formatarMoeda(totalVariaveis)}</p>
          <span className="previsao-qtd">{variaveis.length} item(ns)</span>
        </div>

        {/* Parcelados */}
        <div className="painel previsao-card">
          <div className="previsao-header">
            <Calendar size={20} />
            <h4>Parcelados</h4>
          </div>
          <p className="previsao-valor">{formatarMoeda(totalParcelados)}</p>
          <span className="previsao-qtd">{parcelados.length} parcela(s) no mês</span>
        </div>

        {/* Fatura de Crédito */}
        <div className="painel previsao-card">
          <div className="previsao-header">
            <CreditCard size={20} />
            <h4>Fatura de Crédito</h4>
          </div>
          <p className="previsao-valor">{formatarMoeda(totalCartao)}</p>
          <span className="previsao-qtd">{cartaoCredito.length} lançamento(s)</span>
        </div>
      </div>
    </div>
  );
}