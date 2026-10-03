import { useEffect, useState } from 'react';
import Modal from '../Modal/Modal';
import { moeda } from '../../lib/format';
import './ExclusaoModal.css';

/**
 * `opcoes`: [{ id, rotulo, descricao, acao }] — `acao` é uma função assíncrona.
 * O modal fica aberto enquanto `gasto` estiver preenchido.
 */
export default function ExclusaoModal({ gasto, titulo, opcoes, onFechar }) {
  const [executando, setExecutando] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setErro('');
    setExecutando(null);
  }, [gasto]);

  async function executar(opcao) {
    setExecutando(opcao.id);
    setErro('');
    try {
      await opcao.acao();
    } catch (err) {
      setErro(err.message);
      setExecutando(null);
    }
  }

  return (
    <Modal aberto={Boolean(gasto)} titulo={titulo} onFechar={onFechar}>
      {gasto && (
        <div className="exclusao">
          <p className="exclusao__gasto">
            <strong>{gasto.nome}</strong>
            <span className="numero">{moeda(gasto.valor)}</span>
          </p>

          {opcoes.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className="exclusao__opcao"
              disabled={executando !== null}
              onClick={() => executar(opcao)}
            >
              <strong>{executando === opcao.id ? 'Aguarde…' : opcao.rotulo}</strong>
              <span>{opcao.descricao}</span>
            </button>
          ))}

          {erro && <p className="aviso-erro">{erro}</p>}

          <button type="button" className="btn btn--secundario" onClick={onFechar}>
            Cancelar
          </button>
        </div>
      )}
    </Modal>
  );
}
