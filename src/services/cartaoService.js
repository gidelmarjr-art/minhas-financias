import { supabase } from '../lib/supabaseClient';
import { CARTAO_PADRAO, dataMaisMeses, vencimentoDaFatura } from '../lib/format';

function resolver({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

let promessa = null;

export function limparCache() {
  promessa = null;
}

/** Configuração do cartão ({ dia_fechamento, dia_vencimento, salvo }). Usa valores provisórios se ainda não salva. */
export function obterConfig() {
  if (!promessa) {
    promessa = (async () => {
      const dados = resolver(
        await supabase.from('config_cartao').select('dia_fechamento, dia_vencimento').maybeSingle(),
      );
      return dados ? { ...dados, salvo: true } : { ...CARTAO_PADRAO, salvo: false };
    })().catch((erro) => {
      promessa = null;
      throw erro;
    });
  }
  return promessa;
}

/**
 * Salva o cartão e reajusta as compras no crédito ainda em aberto (variáveis e parceladas).
 * Gastos fixos já gerados não mudam.
 */
export async function salvarConfig({ dia_fechamento, dia_vencimento }) {
  resolver(
    await supabase
      .from('config_cartao')
      .upsert(
        { dia_fechamento, dia_vencimento, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      ),
  );
  limparCache();
  const novo = { dia_fechamento, dia_vencimento, salvo: true };

  const linhas = resolver(
    await supabase
      .from('gastos')
      .select('id, data_compra, parcela_numero')
      .eq('forma_pagamento', 'credito')
      .eq('pago', false)
      .neq('tipo', 'fixo')
      .not('data_compra', 'is', null),
  );
  await Promise.all(
    linhas.map(async (linha) => {
      const base = vencimentoDaFatura(linha.data_compra, novo);
      const data_pagamento = dataMaisMeses(base, (linha.parcela_numero ?? 1) - 1);
      return resolver(await supabase.from('gastos').update({ data_pagamento }).eq('id', linha.id));
    }),
  );

  return novo;
}
