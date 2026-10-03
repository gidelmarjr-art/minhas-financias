import { supabase } from '../lib/supabaseClient';
import { intervaloDoMes } from '../lib/format';

const TABELA = 'gastos';

function resolver({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function listarPorMes(mes) {
  const { inicio, fim } = intervaloDoMes(mes);
  return resolver(
    await supabase
      .from(TABELA)
      .select('*')
      .gte('data_pagamento', inicio)
      .lte('data_pagamento', fim)
      .order('data_pagamento', { ascending: true }),
  );
}

/** Contas não pagas, das mais antigas (atrasadas) às mais distantes. */
export async function listarProximos(limite = 6) {
  return resolver(
    await supabase
      .from(TABELA)
      .select('*')
      .eq('pago', false)
      .order('data_pagamento', { ascending: true })
      .limit(limite),
  );
}

export async function criar({ nome, valor, data_pagamento }) {
  return resolver(
    await supabase.from(TABELA).insert([{ nome, valor, data_pagamento }]).select().single(),
  );
}

export async function atualizar(id, campos) {
  return resolver(await supabase.from(TABELA).update(campos).eq('id', id).select().single());
}

export async function excluir(id) {
  resolver(await supabase.from(TABELA).delete().eq('id', id));
}

export async function confirmarPagamento(id, { data_pago, banco }) {
  return atualizar(id, { pago: true, data_pago, banco });
}

export async function desfazerPagamento(id) {
  return atualizar(id, { pago: false, data_pago: null, banco: null });
}
