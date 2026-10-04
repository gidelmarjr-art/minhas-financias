import { useState } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import { useToast } from '../../components/Toast/Toast';
import { rotuloMes } from '../../lib/format';
import './GastosPassados.css';

export default function GastosPassados() {
  const { avisar } = useToast();
  // Estado para o mês passado selecionado (formato YYYY-MM, ex: '2026-02')
  const [mesPassado, setMesPassado] = useState('2026-01');
  const [valorTotal, setValorTotal] = useState('');
  const [descricao, setDescricao] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valorTotal) {
      avisar('Informe o valor total do período');
      return;
    }

    // Aqui faremos a integração com o serviço para salvar o histórico do mês passado
    avisar(`Gastos de ${rotuloMes(mesPassado)} salvos com sucesso!`);
    setValorTotal('');
    setDescricao('');
  }

  return (
    <div className="gastos-passados">
      <PageHeader
        titulo="Gastos Passados"
        descricao="Cadastre o histórico e dados de meses anteriores para alimentar suas previsões e análises."
      />

      <section className="painel cadastro__form">
        <h2>Registrar histórico de mês anterior</h2>
        <p className="cadastro__ajuda">
          Informe o mês de referência e o valor total gasto ou consolidado para compor a base de previsão futura.
        </p>

        <form onSubmit={handleSubmit} className="form-passados">
          <div className="campo">
            <label htmlFor="mes-referencia">Mês de Referência</label>
            <input
              id="mes-referencia"
              type="month"
              value={mesPassado}
              onChange={(e) => setMesPassado(e.target.value)}
              className="input"
            />
          </div>

          <div className="campo">
            <label htmlFor="valor-total">Valor Total Gasto (R$)</label>
            <input
              id="valor-total"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              className="input"
            />
          </div>

          <div className="campo">
            <label htmlFor="descricao-passada">Observações / Detalhes</label>
            <input
              id="descricao-passada"
              type="text"
              placeholder="Ex: Mês com viagem e gastos atípicos"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="input"
            />
          </div>

          <button type="submit" className="btn btn--primario">
            Salvar Mês Anterior
          </button>
        </form>
      </section>
    </div>
  );
}