import { useEffect, useState } from 'react';
import Modal from '../Modal/Modal';
import { useToast } from '../Toast/Toast';
import { dataCurta, dataDoMes, mesAtual, periodoDaFatura } from '../../lib/format';
import './ConfigCartaoModal.css';

const diaValido = (texto) => {
  const n = Number(texto);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
};

export default function ConfigCartaoModal({ aberto, cartao, onFechar, onSalvar }) {
  const { avisar } = useToast();
  const [fechamento, setFechamento] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setFechamento(String(cartao.dia_fechamento));
      setVencimento(String(cartao.dia_vencimento));
      setErro('');
    }
  }, [aberto, cartao]);

  const f = diaValido(fechamento);
  const v = diaValido(vencimento);
  const exemplo =
    f && v
      ? (() => {
          const config = { dia_fechamento: f, dia_vencimento: v };
          const periodo = periodoDaFatura(mesAtual(), config);
          return `Exemplo: a fatura que vence em ${dataCurta(dataDoMes(mesAtual(), v))} reúne as compras de ${dataCurta(periodo.inicio)} a ${dataCurta(periodo.fim)}.`;
        })()
      : '';

  async function aoEnviar(e) {
    e.preventDefault();
    if (!f || !v) return setErro('Informe dias entre 1 e 31.');
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({ dia_fechamento: f, dia_vencimento: v });
      avisar('Cartão atualizado');
      onFechar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Fatura do cartão de crédito" onFechar={onFechar}>
      <form className="config-cartao" onSubmit={aoEnviar} noValidate>
        <p className="config-cartao__texto">
          A fatura vai do dia seguinte ao fechamento até o próximo fechamento. Uma compra feita até o dia
          do fechamento entra na fatura daquele mês; depois disso, na do mês seguinte.
        </p>

        <div className="config-cartao__campos">
          <label className="campo">
            <span>Fecha no dia</span>
            <input
              type="number"
              min="1"
              max="31"
              value={fechamento}
              onChange={(e) => setFechamento(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="campo">
            <span>Vence no dia</span>
            <input
              type="number"
              min="1"
              max="31"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>

        {exemplo && <p className="config-cartao__exemplo">{exemplo}</p>}
        <p className="config-cartao__nota">
          As compras no crédito ainda em aberto serão ajustadas. Gastos fixos já gerados não mudam.
        </p>

        {erro && <p className="aviso-erro">{erro}</p>}

        <div className="config-cartao__acoes">
          <button type="button" className="btn btn--secundario" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
