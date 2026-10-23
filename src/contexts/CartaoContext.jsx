import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import ConfigCartaoModal from '../components/ConfigCartaoModal/ConfigCartaoModal';
import * as cartaoService from '../services/cartaoService';
import { CARTAO_PADRAO } from '../lib/format';

const CartaoContext = createContext(null);

/**
 * Guarda o fechamento e o vencimento da fatura do cartão e o modal para ajustá-los.
 * `versao` muda quando o cartão é salvo, para as telas recarregarem as contas.
 */
export function CartaoProvider({ children }) {
  const { sessao, somenteGeral } = useAuth();
  const [cartao, setCartao] = useState({ ...CARTAO_PADRAO, salvo: false });
  const [versao, setVersao] = useState(0);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!sessao) {
      cartaoService.limparCache();
      return;
    }
    if (somenteGeral) {
      // a visão geral não tem cartão próprio: usa o de uma das pessoas, só para mostrar o período
      cartaoService
        .listarConfigs()
        .then((configs) => setCartao([...configs.values()][0] ?? { ...CARTAO_PADRAO, salvo: false }))
        .catch(() => {});
      return;
    }
    cartaoService
      .obterConfig()
      .then(setCartao)
      .catch(() => {});
  }, [sessao, somenteGeral]);

  const salvar = useCallback(async (config) => {
    const novo = await cartaoService.salvarConfig(config);
    setCartao(novo);
    setVersao((v) => v + 1);
  }, []);

  const valor = useMemo(
    () => ({ cartao, versao, abrirConfig: () => setAberto(true) }),
    [cartao, versao],
  );

  return (
    <CartaoContext.Provider value={valor}>
      {children}
      <ConfigCartaoModal
        aberto={aberto}
        cartao={cartao}
        onFechar={() => setAberto(false)}
        onSalvar={salvar}
      />
    </CartaoContext.Provider>
  );
}

export const useCartao = () => useContext(CartaoContext);
