const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const moeda = (valor) => brl.format(Number(valor) || 0);

export const BANCOS = [
  'Nubank',
  'Itaú',
  'Bradesco',
  'Banco do Brasil',
  'Caixa',
  'Santander',
  'Inter',
  'C6 Bank',
  'PicPay',
  'Mercado Pago',
];

export function paraISO(data) {
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${d}`;
}

export const hojeISO = () => paraISO(new Date());
export const mesAtual = () => hojeISO().slice(0, 7);

/** Primeiro e último dia de um mês "AAAA-MM". */
export function intervaloDoMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, '0')}` };
}

export function deslocarMes(mes, delta) {
  const [ano, m] = mes.split('-').map(Number);
  return paraISO(new Date(ano, m - 1 + delta, 1)).slice(0, 7);
}

export function rotuloMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const texto = new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Data padrão de um formulário: hoje, se estiver no mês selecionado; senão dia 1. */
export function dataPadrao(mes) {
  const hoje = hojeISO();
  return hoje.startsWith(mes) ? hoje : `${mes}-01`;
}

export function dataCurta(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function diasAte(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
}

export function textoPrazo(iso) {
  const n = diasAte(iso);
  if (n === 0) return 'vence hoje';
  if (n === 1) return 'vence amanhã';
  if (n > 1) return `vence em ${n} dias`;
  if (n === -1) return 'venceu ontem';
  return `venceu há ${-n} dias`;
}

export function statusDoGasto(gasto) {
  if (gasto.pago) return 'pago';
  return diasAte(gasto.data_pagamento) < 0 ? 'atrasado' : 'pendente';
}

/** Aceita "1.234,56", "1234,56" ou "1234.56". Retorna NaN se inválido. */
export function parseValor(texto) {
  const limpo = String(texto).replace(/[^\d,.-]/g, '');
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const numero = Number(normal);
  return Number.isFinite(numero) ? numero : NaN;
}

/** Data "AAAA-MM-DD" de um dia dentro de um mês "AAAA-MM" (ajusta dia 31 em meses curtos). */
export function dataDoMes(mes, dia) {
  const [ano, m] = mes.split('-').map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  return `${mes}-${String(Math.min(Number(dia), ultimo)).padStart(2, '0')}`;
}

/** Soma meses a uma data ISO mantendo o dia (ajustado ao fim do mês quando preciso). */
export function dataMaisMeses(iso, n) {
  const [ano, m, dia] = iso.split('-').map(Number);
  const mes = deslocarMes(`${ano}-${String(m).padStart(2, '0')}`, n);
  return dataDoMes(mes, dia);
}

export function rotuloTipo(gasto) {
  let base = 'Variável';
  if (gasto.tipo === 'fixo') base = 'Fixo';
  if (gasto.tipo === 'parcelado') base = `Parcela ${gasto.parcela_numero}/${gasto.parcela_total}`;
  if (gasto.forma_pagamento === 'credito') return `${base} · Crédito`;
  if (gasto.forma_pagamento === 'debito') return `${base} · Débito`;
  return base;
}

export const FORMAS_PAGAMENTO = {
  debito: 'Débito',
  credito: 'Crédito',
  manual: 'Pagar manualmente',
};

/* ---------- Fatura do cartão de crédito ---------- */

/** Valores provisórios até o usuário ajustar o cartão. */
export const CARTAO_PADRAO = { dia_fechamento: 20, dia_vencimento: 27 };

export const dataDiaMes = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export function somarDias(iso, n) {
  const [ano, m, dia] = iso.split('-').map(Number);
  return paraISO(new Date(ano, m - 1, dia + n));
}

/**
 * Mês "AAAA-MM" em que vence a fatura que recebe uma compra feita em `iso`.
 * A compra feita até o dia do fechamento (inclusive) entra na fatura que fecha neste mês;
 * depois disso, entra na que fecha no mês seguinte. Se o vencimento é num dia menor ou
 * igual ao fechamento, a fatura vence no mês depois do fechamento.
 */
export function mesDaFatura(iso, cartao) {
  const mesCompra = iso.slice(0, 7);
  const dia = Number(iso.slice(8, 10));
  const mesFechamento = dia <= cartao.dia_fechamento ? mesCompra : deslocarMes(mesCompra, 1);
  return cartao.dia_vencimento > cartao.dia_fechamento ? mesFechamento : deslocarMes(mesFechamento, 1);
}

export function vencimentoDaFatura(iso, cartao) {
  return dataDoMes(mesDaFatura(iso, cartao), cartao.dia_vencimento);
}

/** Período de compras da fatura que vence no mês "AAAA-MM": do dia seguinte ao fechamento anterior até o fechamento. */
export function periodoDaFatura(mesVencimento, cartao) {
  const mesFechamento =
    cartao.dia_vencimento > cartao.dia_fechamento ? mesVencimento : deslocarMes(mesVencimento, -1);
  return {
    inicio: somarDias(dataDoMes(deslocarMes(mesFechamento, -1), cartao.dia_fechamento), 1),
    fim: dataDoMes(mesFechamento, cartao.dia_fechamento),
  };
}

/** Data de um dia fixo do mês (ex.: cobrança dia 25) dentro do período de uma fatura. */
export function dataNoPeriodo({ inicio, fim }, dia) {
  const candidatas = [dataDoMes(inicio.slice(0, 7), dia), dataDoMes(fim.slice(0, 7), dia)];
  return candidatas.find((c) => c >= inicio && c <= fim) ?? fim;
}
