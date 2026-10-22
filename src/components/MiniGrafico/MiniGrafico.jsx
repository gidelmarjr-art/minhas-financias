import { curvaSuave } from '../../lib/series';
import './MiniGrafico.css';

const L = 88;
const A = 46;

/** Barras ou linha em miniatura. `serie` é uma lista de números; o desenho se anima ao aparecer. */
export default function MiniGrafico({ tipo = 'barras', serie }) {
  const maximo = Math.max(...serie, 0);
  const vazio = maximo === 0;

  if (tipo === 'linha') {
    const passo = L / (serie.length - 1 || 1);
    const pontos = serie.map((v, i) => [i * passo, A - 4 - (vazio ? 0 : (v / maximo) * (A - 10))]);
    const d = curvaSuave(pontos);
    return (
      <svg className="mini-grafico" viewBox={`0 0 ${L} ${A}`} aria-hidden="true">
        {!vazio && <path className="mini-grafico__area" d={`${d} L${L},${A} L0,${A} Z`} />}
        <path className="mini-grafico__linha" d={d} pathLength="1" />
      </svg>
    );
  }

  const largura = L / serie.length;
  const miolo = largura * 0.58;
  const indiceMaior = serie.indexOf(maximo);
  return (
    <svg className="mini-grafico" viewBox={`0 0 ${L} ${A}`} aria-hidden="true">
      {serie.map((v, i) => {
        const altura = vazio ? 3 : Math.max(3, (v / maximo) * (A - 2));
        return (
          <rect
            key={i}
            className={`mini-grafico__barra ${i === indiceMaior && !vazio ? 'mini-grafico__barra--maior' : ''}`}
            x={i * largura + (largura - miolo) / 2}
            y={A - altura}
            width={miolo}
            height={altura}
            rx={miolo / 2}
            style={{ '--i': i }}
          />
        );
      })}
    </svg>
  );
}
