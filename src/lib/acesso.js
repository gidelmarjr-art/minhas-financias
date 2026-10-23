// Marca se a sessão atual é da "visão geral" (só leitura). Os serviços usam isto para
// NÃO criar contas automáticas em nome de outras pessoas.
let somenteLeitura = false;

export const definirSomenteLeitura = (valor) => {
  somenteLeitura = Boolean(valor);
};
export const ehSomenteLeitura = () => somenteLeitura;
