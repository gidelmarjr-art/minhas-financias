import { useCallback, useEffect, useState } from 'react';
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

export function useGastos(mes) {
  const buscar = useCallback(() => gastosService.listarPorMes(mes), [mes]);
  const { dados, ...resto } = useCarregar(buscar);
  return { gastos: dados, ...resto };
}

export function useProximosPagamentos() {
  const buscar = useCallback(() => gastosService.listarProximos(6), []);
  const { dados, ...resto } = useCarregar(buscar);
  return { proximos: dados, ...resto };
}
