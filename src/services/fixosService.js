import { supabase } from '../lib/supabaseClient';
import { dataDoMes, dataNoPeriodo, deslocarMes, periodoDaFatura } from '../lib/format';
import { obterConfig } from './cartaoService';

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
 * No débito automático a conta já nasce paga, com o banco do cadastro.
 */
export async function garantirFixosDoMes(mes) {
  const fixos = await listarAtivosNoMes(mes);
  if (fixos.length === 0) return;

  const cartao = await obterConfig();
  const linhas = fixos.map((f) => {
    if (f.forma_pagamento === 'credito') {
      // Cada fatura recebe exatamente uma cobrança do fixo: a que cai dentro do ciclo dela.
      return {
        fixo_id: f.id,
        tipo: 'fixo',
        nome: f.nome,
        valor: f.valor,
        forma_pagamento: 'credito',
        data_compra: dataNoPeriodo(periodoDaFatura(mes, cartao), f.dia_vencimento),
        data_pagamento: dataDoMes(mes, cartao.dia_vencimento),
      };
    }
    const data = dataDoMes(mes, f.dia_vencimento);
    const base = {
      fixo_id: f.id,
      tipo: 'fixo',
      nome: f.nome,
      valor: f.valor,
      data_pagamento: data,
      forma_pagamento: f.forma_pagamento,
    };
    return f.forma_pagamento === 'debito'
      ? { ...base, pago: true, data_pago: data, banco: f.banco }
      : base;
  });

  resolver(
    await supabase
      .from('gastos')
      .upsert(linhas, { onConflict: 'fixo_id,mes_referencia', ignoreDuplicates: true }),
  );
}

export async function criarFixo({ nome, valor, dia_vencimento, forma_pagamento, banco }, mes) {
  resolver(
    await supabase.from(TABELA).insert([
      {
        nome,
        valor,
        dia_vencimento,
        inicio_mes: `${mes}-01`,
        forma_pagamento,
        banco: forma_pagamento === 'debito' ? banco : null,
      },
    ]),
  );
}

/**
 * Altera o fixo e as contas do mês informado em diante que ainda não foram pagas
 * (no débito automático, todas — elas já nascem pagas). A forma de pagamento não muda.
 */
export async function atualizarFixo(fixoId, { nome, valor, dia_vencimento }, mes) {
  resolver(await supabase.from(TABELA).update({ nome, valor, dia_vencimento }).eq('id', fixoId));

  const linhas = resolver(
    await supabase
      .from('gastos')
      .select('id, data_pagamento, pago, forma_pagamento')
      .eq('fixo_id', fixoId)
      .gte('mes_referencia', `${mes}-01`),
  );

  const cartao = await obterConfig();
  await Promise.all(
    linhas
      .filter((l) => !l.pago || l.forma_pagamento === 'debito')
      .map(async (linha) => {
        const mesDaLinha = linha.data_pagamento.slice(0, 7);
        if (linha.forma_pagamento === 'credito') {
          // no cartão o vencimento é o da fatura; muda só o dia da cobrança
          const data_compra = dataNoPeriodo(periodoDaFatura(mesDaLinha, cartao), dia_vencimento);
          return resolver(
            await supabase.from('gastos').update({ nome, valor, data_compra }).eq('id', linha.id),
          );
        }
        const data = dataDoMes(mesDaLinha, dia_vencimento);
        const campos = { nome, valor, data_pagamento: data };
        if (linha.forma_pagamento === 'debito') campos.data_pago = data;
        return resolver(await supabase.from('gastos').update(campos).eq('id', linha.id));
      }),
  );
}

/** Para de repetir a partir do mês informado. Meses já pagos manualmente continuam no histórico. */
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
      .or('pago.eq.false,forma_pagamento.eq.debito')
      .gte('mes_referencia', `${mes}-01`),
  );
}
