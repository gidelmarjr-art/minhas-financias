import { useContagem } from '../../hooks/useContagem';
import { moeda } from '../../lib/format';

/** Mostra um número que "sobe" até o valor final e continua de onde parou quando o valor muda. */
export default function ValorAnimado({ valor, formatar = moeda, duracao = 1100 }) {
  const atual = useContagem(Number(valor) || 0, duracao);
  return <>{formatar(atual)}</>;
}
