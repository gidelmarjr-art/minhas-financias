import { useCallback, useEffect, useState } from 'react';
import * as service from '../services/gastosPassadosService';

export function useGastosPassados() {
  const [gastosPassados, setGastosPassados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try { setGastosPassados(await service.listar()); }
    catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);
  return { gastosPassados, carregando, erro, recarregar };
}
