import { useCallback, useEffect, useState } from 'react';
import * as entradasService from '../services/entradasService';

export function useEntradas(mes) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setEntradas(await entradasService.listarPorMes(mes));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [mes]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { entradas, carregando, erro, recarregar };
}
