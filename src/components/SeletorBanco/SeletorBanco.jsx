import { useState } from 'react';
import { BANCOS } from '../../lib/format';
import './SeletorBanco.css';

const OUTRO = '__outro__';

/**
 * Lista de bancos com opção "Outro banco". `valor` é o nome final do banco ('' = nenhum).
 * Use `key` no componente para reiniciar a seleção quando o formulário for reaberto.
 */
export default function SeletorBanco({ valor, onChange, rotulo = 'Banco' }) {
  const [outro, setOutro] = useState(Boolean(valor) && !BANCOS.includes(valor));

  function aoEscolher(e) {
    if (e.target.value === OUTRO) {
      setOutro(true);
      onChange('');
    } else {
      setOutro(false);
      onChange(e.target.value);
    }
  }

  return (
    <div className="seletor-banco">
      <label className="campo">
        <span>{rotulo}</span>
        <select value={outro ? OUTRO : valor} onChange={aoEscolher}>
          <option value="">Selecione o banco</option>
          {BANCOS.map((banco) => (
            <option key={banco} value={banco}>
              {banco}
            </option>
          ))}
          <option value={OUTRO}>Outro banco</option>
        </select>
      </label>
      {outro && (
        <label className="campo">
          <span>Nome do banco</span>
          <input value={valor} onChange={(e) => onChange(e.target.value)} maxLength={40} />
        </label>
      )}
    </div>
  );
}
