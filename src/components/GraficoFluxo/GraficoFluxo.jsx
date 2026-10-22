import { useState } from 'react';
import { curvaSuave } from '../../lib/series';
import { moeda } from '../../lib/format';
import './GraficoFluxo.css';

const L = 600;
const A = 200;
const TOPO = 12;

/**
 * Duas linhas acumuladas ao longo do mês: o que entrou e o que vence.
 * Passe o mouse (ou toque) para ver os totais de cada dia.
 */
export default function GraficoFluxo({ entradas, gastos, hoje }) {
  const [ativo, setAtivo] = useState(null);
  const dias = entradas.length;
  const maximo = Math.max(...entradas, ...gastos, 1);
  const x = (i) => (dias > 1 ? (i / (dias - 1)) * L : 0);
  const y = (v) => A - 6 - (v / maximo) * (A - 6 - TOPO);
  const pontos = (serie) => serie.map((v, i) => [x(i), y(v)]);
  const linhaEntradas = curvaSuave(pontos(entradas));
  const linhaGastos = curvaSuave(pontos(gastos));

  function aoMover(e) {
    const caixa = e.currentTarget.getBoundingClientRect();
    const posicao = (e.clientX - caixa.left) / caixa.width;
    setAtivo(Math.min(dias - 1, Math.max(0, Math.round(posicao * (dias - 1)))));
  }

  const esquerda = ativo === null ? 0 : (ativo / (dias - 1)) * 100;

  return (
    <div className="fluxo">
      <div
        className="fluxo__area"
        onPointerMove={aoMover}
        onPointerLeave={() => setAtivo(null)}
        role="img"
        aria-label="Gráfico do mês: total acumulado de entradas e de contas, dia a dia"
      >
        <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} className="fluxo__grade" x1="0" x2={L} y1={A * f} y2={A * f} />
          ))}
          <path className="fluxo__sombra" d={`${linhaGastos} L${L},${A} L0,${A} Z`} />
          <path className="fluxo__linha fluxo__linha--gastos" d={linhaGastos} pathLength="1" />
          <path className="fluxo__linha fluxo__linha--entradas" d={linhaEntradas} pathLength="1" />
          {hoje && <line className="fluxo__hoje" x1={x(hoje - 1)} x2={x(hoje - 1)} y1="0" y2={A} />}
        </svg>

        {ativo !== null && (
          <>
            <span className="fluxo__guia" style={{ left: `${esquerda}%` }} />
            <span
              className="fluxo__ponto fluxo__ponto--entradas"
              style={{ left: `${esquerda}%`, top: `${(y(entradas[ativo]) / A) * 100}%` }}
            />
            <span
              className="fluxo__ponto fluxo__ponto--gastos"
              style={{ left: `${esquerda}%`, top: `${(y(gastos[ativo]) / A) * 100}%` }}
            />
            <div
              className={`fluxo__dica ${esquerda > 62 ? 'fluxo__dica--esquerda' : ''}`}
              style={{ left: `${esquerda}%` }}
            >
              <strong>Dia {ativo + 1}</strong>
              <span>
                <i className="fluxo__marca fluxo__marca--entradas" />
                Entradas <b className="numero">{moeda(entradas[ativo])}</b>
              </span>
              <span>
                <i className="fluxo__marca fluxo__marca--gastos" />
                Contas <b className="numero">{moeda(gastos[ativo])}</b>
              </span>
            </div>
          </>
        )}
      </div>

      <div className="fluxo__eixo" aria-hidden="true">
        <span>1</span>
        <span>{Math.round(dias / 2)}</span>
        <span>{dias}</span>
      </div>
    </div>
  );
}
