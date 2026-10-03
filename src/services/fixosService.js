import { supabase } from '../lib/supabaseClient';
import { dataDoMes, deslocarMes } from '../lib/format';

const TABELA = 'gastos_fixos';

function resolver({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

/** Gastos fixos que valem para o mês "AAAA-MM". */
export async function listarAtivosNoMes(mes) {
  const inicio = `${mes}-01`;
  return resolver(
    await supabase
      .from(TABELA)
      .select('*')
      .lte('inicio_mes', inicio)
      .or(`fim_mes.is.null,fim_mes.gte.${inicio}`),
  );
}

/**
 * Cria, se ainda não existir, a conta de cada gasto fixo ativo no mês.
 * Assim cada mês tem sua própria linha, com status e banco de pagamento próprios.
 */
export async function garantirFixosDoMes(mes) {
  const fixos = await listarAtivosNoMes(mes);
  if (fixos.length === 0) return;

  const linhas = fixos.map((f) => ({
    fixo_id: f.id,
    tipo: 'fixo',
    nome: f.nome,
    valor: f.valor,
    data_pagamento: dataDoMes(mes, f.dia_vencimento),
  }));

  resolver(
    await supabase
      .from('gastos')
      .upsert(linhas, { onConflict: 'fixo_id,mes_referencia', ignoreDuplicates: true }),
  );
}

export async function criarFixo({ nome, valor, dia_vencimento }, mes) {
  resolver(
    await supabase
      .from(TABELA)
      .insert([{ nome, valor, dia_vencimento, inicio_mes: `${mes}-01` }]),
  );
}

/** Altera o fixo e as contas ainda não pagas do mês informado em diante. */
export async function atualizarFixo(fixoId, { nome, valor, dia_vencimento }, mes) {
  resolver(await supabase.from(TABELA).update({ nome, valor, dia_vencimento }).eq('id', fixoId));

  const linhas = resolver(
    await supabase
      .from('gastos')
      .select('id, data_pagamento')
      .eq('fixo_id', fixoId)
      .eq('pago', false)
      .gte('mes_referencia', `${mes}-01`),
  );

  await Promise.all(
    linhas.map(async (linha) =>
      resolver(
        await supabase
          .from('gastos')
          .update({
            nome,
            valor,
            data_pagamento: dataDoMes(linha.data_pagamento.slice(0, 7), dia_vencimento),
          })
          .eq('id', linha.id),
      ),
    ),
  );
}

/** Para de repetir a partir do mês informado. Meses já pagos continuam no histórico. */
export async function encerrarFixo(fixoId, mes) {
  resolver(
    await supabase
      .from(TABELA)
      .update({ fim_mes: `${deslocarMes(mes, -1)}-01` })
      .eq('id', fixoId),
  );
  resolver(
    await supabase
      .from('gastos')
      .delete()
      .eq('fixo_id', fixoId)
      .eq('pago', false)
      .gte('mes_referencia', `${mes}-01`),
  );
}
