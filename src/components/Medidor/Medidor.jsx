import { useEffect, useState } from 'react';
import ValorAnimado from '../ValorAnimado/ValorAnimado';
import './Medidor.css';

/** Meia-lua que se preenche até `percentual` (0 a 100), com o número subindo junto. */
export default function Medidor({ percentual, rotulo, detalhe, children }) {
  const [alvo, setAlvo] = useState(0);

  useEffect(() => {
    // começa vazio e, no quadro seguinte, vai até o valor: a transição CSS faz a varredura
    const quadro = requestAnimationFrame(() => setAlvo(percentual));
    return () => cancelAnimationFrame(quadro);
  }, [percentual]);

  return (
    <div className="medidor">
      <p className="medidor__rotulo">{rotulo}</p>
      <div className="medidor__arco">
        <svg viewBox="0 0 200 108" aria-hidden="true">
          <path className="medidor__trilha" d="M 16 100 A 84 84 0 0 1 184 100" pathLength="100" />
          <path
            className="medidor__preenchido"
            d="M 16 100 A 84 84 0 0 1 184 100"
            pathLength="100"
            strokeDasharray={`${alvo} 100`}
          />
        </svg>
        <div className="medidor__centro" role="meter" aria-valuenow={percentual} aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}>
          <strong className="numero">
            <ValorAnimado valor={percentual} formatar={(v) => `${Math.round(v)}%`} duracao={1400} />
          </strong>
          {detalhe && <span>{detalhe}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}
