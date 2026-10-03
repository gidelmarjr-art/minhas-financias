import { useEffect, useState } from 'react';
import Modal from '../Modal/Modal';
import { BANCOS, dataCurta, hojeISO, moeda } from '../../lib/format';
import './ConfirmarPagamentoModal.css';

const OUTRO = '__outro__';

export default function ConfirmarPagamentoModal({ gasto, onFechar, onConfirmar }) {
  const [dataPago, setDataPago] = useState(hojeISO());
  const [bancoSel, setBancoSel] = useState('');
  const [bancoOutro, setBancoOutro] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (gasto) {
      setDataPago(hojeISO());
      setBancoSel('');
      setBancoOutro('');
      setErro('');
    }
  }, [gasto]);

  async function aoEnviar(e) {
    e.preventDefault();
    const banco = bancoSel === OUTRO ? bancoOutro.trim() : bancoSel;
    if (!dataPago) return setErro('Informe quando o pagamento foi feito.');
    if (!banco) return setErro('Escolha o banco usado no pagamento.');

    setSalvando(true);
    setErro('');
    try {
      await onConfirmar(gasto, { data_pago: dataPago, banco });
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={Boolean(gasto)} titulo="Confirmar pagamento" onFechar={onFechar}>
      {gasto && (
        <form className="confirmar-modal" onSubmit={aoEnviar} noValidate>
          <div className="confirmar-modal__resumo">
            <strong>{gasto.nome}</strong>
            <span className="numero">{moeda(gasto.valor)}</span>
            <small>Vencimento em {dataCurta(gasto.data_pagamento)}</small>
          </div>

          <label className="campo">
            <span>Data do pagamento</span>
            <input type="date" value={dataPago} onChange={(e) => setDataPago(e.target.value)} />
          </label>

          <label className="campo">
            <span>Banco</span>
            <select value={bancoSel} onChange={(e) => setBancoSel(e.target.value)}>
              <option value="">Selecione o banco</option>
              {BANCOS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value={OUTRO}>Outro banco</option>
            </select>
          </label>

          {bancoSel === OUTRO && (
            <label className="campo">
              <span>Nome do banco</span>
              <input value={bancoOutro} onChange={(e) => setBancoOutro(e.target.value)} maxLength={40} />
            </label>
          )}

          {erro && <p className="aviso-erro">{erro}</p>}

          <div className="confirmar-modal__acoes">
            <button type="button" className="btn btn--secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primario" disabled={salvando}>
              {salvando ? 'Confirmando…' : 'Confirmar pagamento'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
