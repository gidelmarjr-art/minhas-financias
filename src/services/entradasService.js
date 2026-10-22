import { supabase } from '../lib/supabaseClient';
import { intervaloDoMes } from '../lib/format';

const TABELA = 'entradas';

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
      .gte('data_entrada', inicio)
      .lte('data_entrada', fim)
      .order('data_entrada', { ascending: false }),
  );
}

export async function criar({ descricao, valor, data_entrada }) {
  return resolver(
    await supabase.from(TABELA).insert([{ descricao, valor, data_entrada }]).select().single(),
  );
}

export async function excluir(id) {
  resolver(await supabase.from(TABELA).delete().eq('id', id));
}
