import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Abas from '../../components/Abas/Abas';
import GastoForm from '../../components/GastoForm/GastoForm';
import ListaGastos from '../../components/ListaGastos/ListaGastos';
import ExclusaoModal from '../../components/ExclusaoModal/ExclusaoModal';
import { useToast } from '../../components/Toast/Toast';
import { useMes } from '../../contexts/MesContext';
import { useGastos } from '../../hooks/useGastos';
import * as gastosService from '../../services/gastosService';
import * as fixosService from '../../services/fixosService';
import { rotuloMes } from '../../lib/format';
import './CadastroGastos.css';

const TEXTOS = {
  fixo: {
    novo: 'Novo gasto fixo',
    ajuda:
      'Entra todo mês, a partir do mês selecionado, até você encerrar. Ex.: aluguel, internet, mensalidades.',
    lista: 'Gastos fixos do mês',
    vazio: 'Nenhum gasto fixo neste mês',
    vazioDescricao: 'Cadastre aluguel, internet e outras contas que se repetem.',
  },
  variavel: {
    novo: 'Novo gasto variável',
    ajuda: 'Vale só para o mês da data de pagamento. Ex.: mercado, farmácia, conserto.',
    lista: 'Gastos variáveis do mês',
    vazio: 'Nenhum gasto variável neste mês',
    vazioDescricao: 'Use o formulário acima para cadastrar o primeiro.',
  },
  parcelado: {
    novo: 'Nova compra parcelada',
    ajuda:
      'Informe o valor da parcela e quantas vezes. Uma parcela entra em cada mês, a partir da data da primeira.',
    lista: 'Parcelas que vencem no mês',
    vazio: 'Nenhuma parcela neste mês',
    vazioDescricao: 'Cadastre uma compra parcelada para ver as parcelas aqui.',
  },
};

export default function CadastroGastos() {
  const { mes } = useMes();
  const { avisar } = useToast();
  const { gastos, carregando, erro, recarregar } = useGastos(mes);
  const [aba, setAba] = useState('fixo');
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const porTipo = useMemo(
    () => ({
      fixo: gastos.filter((g) => g.tipo === 'fixo'),
      variavel: gastos.filter((g) => g.tipo === 'variavel'),
      parcelado: gastos.filter((g) => g.tipo === 'parcelado'),
    }),
    [gastos],
  );

  const abas = [
    { id: 'fixo', rotulo: 'Gastos fixos', contagem: porTipo.fixo.length },
    { id: 'variavel', rotulo: 'Gastos variáveis', contagem: porTipo.variavel.length },
    { id: 'parcelado', rotulo: 'Compras parceladas', contagem: porTipo.parcelado.length },
  ];
  const textos = TEXTOS[aba];

  function mudarAba(nova) {
    setAba(nova);
    setEditando(null);
  }

  async function salvar(campos) {
    if (editando) {
      if (aba === 'fixo') await fixosService.atualizarFixo(editando.fixo_id, campos, mes);
      else {
        await gastosService.editarGasto(editando, campos);
        const mudouForma = campos.forma_pagamento !== editando.forma_pagamento;
        if (aba === 'parcelado' && editando.grupo_id && mudouForma) {
          await gastosService.atualizarFormaDoGrupo(editando.grupo_id, campos.forma_pagamento);
        }
      }
      setEditando(null);
      avisar('Gasto atualizado');
    } else if (aba === 'fixo') {
      await fixosService.criarFixo(campos, mes);
      avisar(`Gasto fixo cadastrado. Ele entra todo mês a partir de ${rotuloMes(mes)}`);
    } else if (aba === 'parcelado') {
      await gastosService.criarParcelado(campos);
      avisar(`Compra cadastrada em ${campos.parcelas} parcelas`);
    } else {
      await gastosService.criarVariavel(campos);
      const mesDoGasto = campos.data_pagamento.slice(0, 7);
      const sufixo = campos.forma_pagamento === 'debito' ? ' e já marcado como pago' : '';
      avisar(
        mesDoGasto === mes
          ? `Gasto cadastrado${sufixo}`
          : `Gasto cadastrado em ${rotuloMes(mesDoGasto)}${sufixo}`,
      );
    }
    recarregar();
  }

  async function concluirExclusao(acao, mensagem) {
    await acao();
    if (editando?.id === excluindo?.id) setEditando(null);
    setExcluindo(null);
    avisar(mensagem);
    recarregar();
  }

  function opcoesDeExclusao(gasto) {
    if (gasto.tipo === 'fixo') {
      return [
        {
          id: 'encerrar',
          rotulo: `Encerrar a partir de ${rotuloMes(mes)}`,
          descricao:
            'Deixa de aparecer neste mês e nos próximos. Meses já pagos continuam no histórico.',
          acao: () =>
            concluirExclusao(() => fixosService.encerrarFixo(gasto.fixo_id, mes), 'Gasto fixo encerrado'),
        },
      ];
    }
    if (gasto.tipo === 'parcelado') {
      return [
        {
          id: 'uma',
          rotulo: 'Só esta parcela',
          descricao: 'As outras parcelas da compra continuam.',
          acao: () => concluirExclusao(() => gastosService.excluir(gasto.id), 'Parcela excluída'),
        },
        {
          id: 'restantes',
          rotulo: 'Esta e as próximas não pagas',
          descricao: 'Cancela o resto da compra. Parcelas já pagas ficam no histórico.',
          acao: () =>
            concluirExclusao(() => gastosService.excluirParcelasRestantes(gasto), 'Parcelas excluídas'),
        },
      ];
    }
    return [
      {
        id: 'excluir',
        rotulo: 'Excluir gasto',
        descricao: 'Remove este gasto do mês.',
        acao: () => concluirExclusao(() => gastosService.excluir(gasto.id), 'Gasto excluído'),
      },
    ];
  }

  return (
    <div className="cadastro">
      <PageHeader
        titulo="Cadastro de gastos"
        descricao="Fixos, variáveis e compras parceladas, cada um do seu jeito."
      />

      <Abas abas={abas} ativa={aba} onMudar={mudarAba} rotulo="Tipo de gasto" />

      <section className="painel cadastro__form">
        <h2>{editando ? 'Editar gasto' : textos.novo}</h2>
        <p className="cadastro__ajuda">
          {editando && aba === 'fixo'
            ? `A alteração vale a partir de ${rotuloMes(mes)}, nas contas ainda não pagas.`
            : editando && aba === 'parcelado'
              ? 'Nome, valor e data valem só para esta parcela. A forma de pagamento vale para a compra toda.'
              : textos.ajuda}
        </p>
        <GastoForm
          tipo={aba}
          gasto={editando}
          mes={mes}
          onSalvar={salvar}
          onCancelar={() => setEditando(null)}
        />
      </section>

      {erro && <p className="aviso-erro cadastro__erro">Não foi possível carregar os gastos: {erro}</p>}

      <div className="cadastro__lista">
        <ListaGastos
          titulo={textos.lista}
          descricao={rotuloMes(mes)}
          gastos={porTipo[aba]}
          vazio={carregando ? 'Carregando…' : textos.vazio}
          vazioDescricao={carregando ? undefined : textos.vazioDescricao}
          destaqueId={editando?.id}
          ocupado={carregando}
          renderAcoes={(g) => (
            <>
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
                onClick={() => setExcluindo(g)}
                aria-label={`Excluir ${g.nome}`}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        />
      </div>

      <ExclusaoModal
        gasto={excluindo}
        titulo={aba === 'fixo' ? 'Retirar gasto fixo' : 'Excluir gasto'}
        opcoes={excluindo ? opcoesDeExclusao(excluindo) : []}
        onFechar={() => setExcluindo(null)}
      />
    </div>
  );
}
