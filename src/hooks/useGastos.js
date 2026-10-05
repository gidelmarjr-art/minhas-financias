import { useCallback, useEffect, useState } from 'react';
import { useCartao } from '../contexts/CartaoContext';
import * as gastosService from '../services/gastosService';

function useCarregar(buscar) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setDados(await buscar());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [buscar]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { dados, carregando, erro, recarregar };
}

export function useGastos(mes, userId, somenteLeitura = false) {
  const { versao } = useCartao();
  // `versao` muda quando o cartão é reajustado: recarrega as contas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buscar = useCallback(() => gastosService.listarPorMes(mes, userId, somenteLeitura), [mes, userId, somenteLeitura, versao]);
  const { dados, ...resto } = useCarregar(buscar);
  return { gastos: dados, ...resto };
}

export function useProximosPagamentos(userId, somenteLeitura = false) {
  const { versao } = useCartao();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buscar = useCallback(() => gastosService.listarProximos(6, userId, somenteLeitura), [userId, somenteLeitura, versao]);
  const { dados, ...resto } = useCarregar(buscar);
  return { proximos: dados, ...resto };
}
