import './SeletorForma.css';

const OPCOES = {
  debito: { rotulo: 'Débito', dica: 'Já saiu da conta. Entra como pago.' },
  credito: { rotulo: 'Crédito', dica: 'Vai para a fatura do cartão.' },
  manual: { rotulo: 'Pagar manualmente', dica: 'Boleto, Pix ou conta. Você confirma depois.' },
};

export default function SeletorForma({ valor, onChange, permitidas, desabilitado = false }) {
  return (
    <fieldset className="seletor-forma" disabled={desabilitado}>
      <legend>Forma de pagamento</legend>
      <div className="seletor-forma__opcoes">
        {permitidas.map((id) => (
          <label
            key={id}
            className={`seletor-forma__opcao ${valor === id ? 'seletor-forma__opcao--ativa' : ''}`}
          >
            <input
              type="radio"
              name="forma-pagamento"
              value={id}
              checked={valor === id}
              onChange={() => onChange(id)}
            />
            <strong>{OPCOES[id].rotulo}</strong>
            <span>{OPCOES[id].dica}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
