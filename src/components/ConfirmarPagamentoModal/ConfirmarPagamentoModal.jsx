import { useEffect, useState } from 'react';
import Modal from '../Modal/Modal';
import SeletorBanco from '../SeletorBanco/SeletorBanco';
import { hojeISO } from '../../lib/format';
import './ConfirmarPagamentoModal.css';

/**
 * Pede a data e o banco do pagamento.
 * `resumo`: { titulo, valor, detalhe } mostrado no topo (uma conta ou a fatura inteira).
 * `onConfirmar({ data_pago, banco })` deve retornar uma Promise.
 */
export default function ConfirmarPagamentoModal({
  aberto,
  titulo = 'Confirmar pagamento',
  resumo,
  textoBotao = 'Confirmar pagamento',
  onFechar,
  onConfirmar,
}) {
  const [dataPago, setDataPago] = useState(hojeISO());
  const [banco, setBanco] = useState('');
  const [chave, setChave] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setDataPago(hojeISO());
      setBanco('');
      setChave((c) => c + 1);
      setErro('');
    }
  }, [aberto]);

  async function aoEnviar(e) {
    e.preventDefault();
    if (!dataPago) return setErro('Informe quando o pagamento foi feito.');
    if (!banco.trim()) return setErro('Escolha o banco usado no pagamento.');

    setSalvando(true);
    setErro('');
    try {
      await onConfirmar({ data_pago: dataPago, banco: banco.trim() });
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo={titulo} onFechar={onFechar}>
      {resumo && (
        <form className="confirmar-modal" onSubmit={aoEnviar} noValidate>
          <div className="confirmar-modal__resumo">
            <strong>{resumo.titulo}</strong>
            <span className="numero">{resumo.valor}</span>
            <small>{resumo.detalhe}</small>
          </div>

          <label className="campo">
            <span>Data do pagamento</span>
            <input type="date" value={dataPago} onChange={(e) => setDataPago(e.target.value)} />
          </label>

          <SeletorBanco key={chave} valor={banco} onChange={setBanco} />

          {erro && <p className="aviso-erro">{erro}</p>}

          <div className="confirmar-modal__acoes">
            <button type="button" className="btn btn--secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primario" disabled={salvando}>
              {salvando ? 'Confirmando…' : textoBotao}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
