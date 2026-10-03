import { supabase } from '../lib/supabaseClient';
import { dataMaisMeses, deslocarMes, intervaloDoMes, mesAtual } from '../lib/format';
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

/** Gasto variável: vale só para o mês da data de pagamento. */
export async function criarVariavel({ nome, valor, data_pagamento }) {
  resolver(
    await supabase.from(TABELA).insert([{ nome, valor, data_pagamento, tipo: 'variavel' }]),
  );
}

/** Compra parcelada: cria uma conta por parcela, uma em cada mês. */
export async function criarParcelado({ nome, valor, parcelas, primeira_data }) {
  const grupoId = crypto.randomUUID();
  const linhas = Array.from({ length: parcelas }, (_, i) => ({
    nome,
    valor,
    tipo: 'parcelado',
    grupo_id: grupoId,
    parcela_numero: i + 1,
    parcela_total: parcelas,
    data_pagamento: dataMaisMeses(primeira_data, i),
  }));
  resolver(await supabase.from(TABELA).insert(linhas));
}

export async function atualizar(id, campos) {
  return resolver(await supabase.from(TABELA).update(campos).eq('id', id).select().single());
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

export async function desfazerPagamento(id) {
  return atualizar(id, { pago: false, data_pago: null, banco: null });
}
