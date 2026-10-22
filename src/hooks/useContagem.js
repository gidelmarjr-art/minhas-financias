import { useEffect, useRef, useState } from 'react';

const reduzido = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Anima um número do valor atual até `alvo` (ease-out). Quando `alvo` muda, continua de onde estava.
 * Respeita "reduzir movimento": nesse caso mostra o valor final na hora.
 */
export function useContagem(alvo, duracao = 1100) {
  const [valor, setValor] = useState(() => (reduzido() ? alvo : 0));
  const atual = useRef(reduzido() ? alvo : 0);

  useEffect(() => {
    if (reduzido()) {
      atual.current = alvo;
      setValor(alvo);
      return undefined;
    }
    const de = atual.current;
    const inicio = performance.now();
    let quadro;
    const passo = (agora) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suavizado = 1 - (1 - progresso) ** 4;
      atual.current = de + (alvo - de) * suavizado;
      setValor(atual.current);
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracao]);

  return valor;
}
