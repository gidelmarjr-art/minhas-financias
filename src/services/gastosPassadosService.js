import { supabase } from '../lib/supabaseClient';

const TABELA = 'gastos_passados';

function resolver({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function listar(userId) {
  return resolver(await (userId ? supabase.from(TABELA).select('*').eq('user_id', userId) : supabase.from(TABELA).select('*')).order('mes_referencia', { ascending: false }));
}

/** Um registro por mês: salvar novamente atualiza o valor e a observação. */
export async function salvar({ mes_referencia, valor_total, observacao }) {
  return resolver(
    await supabase
      .from(TABELA)
      .upsert([{ mes_referencia: `${mes_referencia}-01`, valor_total, observacao: observacao || null }], {
        onConflict: 'user_id,mes_referencia',
      })
      .select()
      .single(),
  );
}

export async function excluir(id) {
  return resolver(await supabase.from(TABELA).delete().eq('id', id));
}
