import { supabase } from '../lib/supabaseClient';
import {
  dataMaisMeses,
  deslocarMes,
  intervaloDoMes,
  mesAtual,
  vencimentoDaFatura,
} from '../lib/format';
import { obterConfig } from './cartaoService';
import { garantirFixosDoMes } from './fixosService';

const TABELA = 'gastos';
const CAMPOS = '*, fixo:gastos_fixos(id, dia_vencimento)';

function resolver({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function listarPorMes(mes) {
  await garantirFixosDoMes(mes);
  const { inicio, fim } = intervaloDoMes(mes);
  return resolver(
    await supabase
      .from(TABELA)
      .select(CAMPOS)
      .gte('data_pagamento', inicio)
      .lte('data_pagamento', fim)
      .order('data_pagamento', { ascending: true }),
  );
}

/** Gastos entre duas datas, usado no gráfico comparativo da visão Geral. */
export async function listarPorPeriodo(inicio, fim) {
  return resolver(
    await supabase
      .from(TABELA)
      .select('valor, data_pagamento')
      .gte('data_pagamento', inicio)
      .lte('data_pagamento', fim),
  );
}

/** Contas não pagas, das mais antigas (atrasadas) às mais distantes. */
export async function listarProximos(limite = 6) {
  await garantirFixosDoMes(mesAtual());
  await garantirFixosDoMes(deslocarMes(mesAtual(), 1));
  return resolver(
    await supabase
      .from(TABELA)
      .select(CAMPOS)
      .eq('pago', false)
      .order('data_pagamento', { ascending: true })
      .limit(limite),
  );
}

/**
 * No crédito, a data informada é a da COMPRA: ela define em qual fatura a conta cai
 * (data_pagamento = vencimento dessa fatura). `deslocamento` leva a parcela para a fatura seguinte.
 */
async function datasDoCredito(dataCompra, deslocamento = 0) {
  const cartao = await obterConfig();
  const vencimento = vencimentoDaFatura(dataCompra, cartao);
  return { data_compra: dataCompra, data_pagamento: dataMaisMeses(vencimento, deslocamento) };
}

/** Campos de pagamento de uma conta nova: no débito ela já nasce paga. */
function camposDePagamento(forma, data, banco) {
  if (forma === 'debito') return { forma_pagamento: 'debito', pago: true, data_pago: data, banco };
  return { forma_pagamento: forma };
}

/** Gasto variável: vale só para o mês da data de pagamento. */
export async function criarVariavel({ nome, valor, data_pagamento, forma_pagamento, banco }) {
  const datas =
    forma_pagamento === 'credito' ? await datasDoCredito(data_pagamento) : { data_pagamento };
  resolver(
    await supabase.from(TABELA).insert([
      {
        nome,
        valor,
        tipo: 'variavel',
        ...datas,
        ...camposDePagamento(forma_pagamento, data_pagamento, banco),
      },
    ]),
  );
}

/** Compra parcelada: cria uma conta por parcela, uma em cada mês. */
export async function criarParcelado({ nome, valor, parcelas, primeira_data, forma_pagamento }) {
  const grupoId = crypto.randomUUID();
  const linhas = [];
  for (let i = 0; i < parcelas; i += 1) {
    const datas =
      forma_pagamento === 'credito'
        ? await datasDoCredito(primeira_data, i)
        : { data_pagamento: dataMaisMeses(primeira_data, i) };
    linhas.push({
      nome,
      valor,
      tipo: 'parcelado',
      forma_pagamento,
      grupo_id: grupoId,
      parcela_numero: i + 1,
      parcela_total: parcelas,
      ...datas,
    });
  }
  resolver(await supabase.from(TABELA).insert(linhas));
}

async function atualizar(id, campos) {
  return resolver(await supabase.from(TABELA).update(campos).eq('id', id).select().single());
}

/**
 * Edita um gasto. Só mexe no pagamento se a forma de pagamento mudou:
 * virar débito marca como pago; sair do débito volta para pendente.
 */
export async function editarGasto(gasto, { forma_pagamento, banco, ...resto }) {
  const campos = { ...resto };
  if (forma_pagamento !== gasto.forma_pagamento) {
    campos.forma_pagamento = forma_pagamento;
    if (forma_pagamento === 'debito') {
      Object.assign(campos, { pago: true, data_pago: resto.data_pagamento, banco });
    } else if (gasto.forma_pagamento === 'debito') {
      // saiu do débito: a conta deixa de ser "já paga"
      Object.assign(campos, { pago: false, data_pago: null, banco: null });
    }
  } else if (forma_pagamento === 'debito') {
    Object.assign(campos, { data_pago: resto.data_pagamento, banco });
  }

  if (forma_pagamento === 'credito' && resto.data_pagamento) {
    const deslocamento = gasto.tipo === 'parcelado' ? (gasto.parcela_numero ?? 1) - 1 : 0;
    Object.assign(campos, await datasDoCredito(resto.data_pagamento, deslocamento));
  } else if (forma_pagamento !== 'credito') {
    campos.data_compra = null;
  }
  return atualizar(gasto.id, campos);
}

/** Numa compra parcelada, todas as parcelas seguem a mesma forma de pagamento. */
export async function atualizarFormaDoGrupo(grupoId, forma_pagamento) {
  resolver(await supabase.from(TABELA).update({ forma_pagamento }).eq('grupo_id', grupoId));
}

export async function excluir(id) {
  resolver(await supabase.from(TABELA).delete().eq('id', id));
}

/** Exclui a parcela informada e as seguintes que ainda não foram pagas. */
export async function excluirParcelasRestantes(gasto) {
  resolver(
    await supabase
      .from(TABELA)
      .delete()
      .eq('grupo_id', gasto.grupo_id)
      .eq('pago', false)
      .gte('data_pagamento', gasto.data_pagamento),
  );
}

export async function confirmarPagamento(id, { data_pago, banco }) {
  return atualizar(id, { pago: true, data_pago, banco });
}

/** Paga várias contas de uma vez (usado para a fatura do cartão de crédito). */
export async function confirmarPagamentoEmLote(ids, { data_pago, banco }) {
  resolver(await supabase.from(TABELA).update({ pago: true, data_pago, banco }).in('id', ids));
}

export async function desfazerPagamento(id) {
  return atualizar(id, { pago: false, data_pago: null, banco: null });
}
