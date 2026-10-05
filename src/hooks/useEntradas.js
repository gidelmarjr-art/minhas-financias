import { useCallback, useEffect, useState } from 'react';
import * as entradasService from '../services/entradasService';

export function useEntradas(mes, userId) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setEntradas(await entradasService.listarPorMes(mes, userId));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [mes, userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { entradas, carregando, erro, recarregar };
}
