import { useEffect, useState } from 'react';
import * as perfisService from '../services/perfisService';

/** Lista as pessoas (T, G…) para a visão geral separar os totais. Fora da visão geral não busca nada. */
export function useUsuarios(ativo) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    if (!ativo) return;
    perfisService
      .listarPessoas()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, [ativo]);

  return { usuarios };
}
