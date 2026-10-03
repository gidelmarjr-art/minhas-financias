import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import GastoForm from '../../components/GastoForm/GastoForm';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useGastos } from '../../hooks/useGastos';
import * as gastosService from '../../services/gastosService';
import { dataCurta, moeda, statusDoGasto } from '../../lib/format';
import './CadastroGastos.css';

export default function CadastroGastos() {
  const { mes } = useMes();
  const { avisar } = useToast();
  const { gastos, carregando, erro, recarregar } = useGastos(mes);
  const [editando, setEditando] = useState(null);

  async function salvar(campos) {
    if (editando) {
      await gastosService.atualizar(editando.id, campos);
      setEditando(null);
      avisar('Gasto atualizado');
    } else {
      await gastosService.criar(campos);
      avisar('Gasto cadastrado');
    }
    recarregar();
  }

  async function excluir(gasto) {
    if (!window.confirm(`Excluir o gasto "${gasto.nome}"?`)) return;
    try {
      await gastosService.excluir(gasto.id);
      if (editando?.id === gasto.id) setEditando(null);
      avisar('Gasto excluído');
      recarregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  const total = gastos.reduce((t, g) => t + Number(g.valor), 0);

  return (
    <div className="cadastro">
      <PageHeader titulo="Cadastro de gastos" descricao="Registre cada conta com valor e data de pagamento." />

      <section className="painel cadastro__form">
        <h2>{editando ? 'Editar gasto' : 'Novo gasto'}</h2>
        <GastoForm
          gasto={editando}
          mes={mes}
          onSalvar={salvar}
          onCancelar={() => setEditando(null)}
        />
      </section>

      <section className="painel cadastro__lista" aria-busy={carregando}>
        <header className="cadastro__topo">
          <h2>Gastos do mês</h2>
          <span className="numero cadastro__total">{moeda(total)}</span>
        </header>

        {erro && <p className="aviso-erro">Não foi possível carregar os gastos: {erro}</p>}

        {!erro && !carregando && gastos.length === 0 ? (
          <EmptyState
            titulo="Nenhum gasto neste mês"
            descricao="Use o formulário acima para cadastrar a primeira conta."
          />
        ) : (
          <ul>
            {gastos.map((g) => (
              <li key={g.id} className={`cadastro__item ${editando?.id === g.id ? 'cadastro__item--ativo' : ''}`}>
                <div className="cadastro__nome">
                  <strong>{g.nome}</strong>
                  <small>Pagar em {dataCurta(g.data_pagamento)}</small>
                </div>
                <StatusBadge status={statusDoGasto(g)} />
                <span className="numero cadastro__valor">{moeda(g.valor)}</span>
                <div className="cadastro__acoes">
                  <button
                    type="button"
                    className="btn btn--secundario btn--icone"
                    onClick={() => setEditando(g)}
                    aria-label={`Editar ${g.nome}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn--perigo btn--icone"
                    onClick={() => excluir(g)}
                    aria-label={`Excluir ${g.nome}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
