import { useCallback, useEffect, useState } from 'react';
import { deslocarMes, intervaloDoMes, rotuloMes } from '../lib/format';
import * as entradasService from '../services/entradasService';
import * as gastosService from '../services/gastosService';
import * as gastosPassadosService from '../services/gastosPassadosService';

const somar = (itens) => itens.reduce((total, item) => total + Number(item.valor || 0), 0);

export function useHistoricoFinanceiro(mesFinal, userId) {
  const [meses, setMeses] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const passados = await gastosPassadosService.listar(userId);
      const referenciasPassadas = passados
        .map((item) => item.mes_referencia.slice(0, 7))
        .filter((referencia) => referencia <= mesFinal);
      const inicioHistorico = referenciasPassadas.sort()[0] ?? deslocarMes(mesFinal, -5);
      const referencias = [];
      for (let referencia = inicioHistorico; referencia <= mesFinal; referencia = deslocarMes(referencia, 1)) {
        referencias.push(referencia);
      }
      const { inicio } = intervaloDoMes(inicioHistorico);
      const { fim } = intervaloDoMes(mesFinal);
      const [entradas, gastos] = await Promise.all([
        entradasService.listarPorPeriodo(inicio, fim, userId),
        gastosService.listarPorPeriodo(inicio, fim, userId),
      ]);
      const historicoPassado = passados.reduce((mapa, item) => {
        const referencia = item.mes_referencia.slice(0, 7);
        mapa.set(referencia, (mapa.get(referencia) ?? 0) + Number(item.valor_total));
        return mapa;
      }, new Map());
      setMeses(referencias.map((referencia) => ({
        referencia,
        rotulo: rotuloMes(referencia).slice(0, 3),
        entradas: somar(entradas.filter((item) => item.data_entrada.startsWith(referencia))),
        gastos: historicoPassado.get(referencia) ?? somar(gastos.filter((item) => item.data_pagamento.startsWith(referencia))),
      })));
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [mesFinal, userId]);

  useEffect(() => { recarregar(); }, [recarregar]);
  return { meses, carregando, erro, recarregar };
}
