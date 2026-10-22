import './Marca.css';

/** Marca do app: raios saindo do centro. Gira devagar quando `animada`. */
export default function Marca({ tamanho = 40, animada = false, className = '' }) {
  const raios = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg
      className={`marca ${animada ? 'marca--animada' : ''} ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <g className="marca__raios" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4">
        {raios.map((i) => (
          <line
            key={i}
            x1="24"
            y1={i % 2 === 0 ? 5 : 10}
            x2="24"
            y2={i % 2 === 0 ? 15 : 17}
            transform={`rotate(${i * 22.5} 24 24)`}
          />
        ))}
      </g>
    </svg>
  );
}
