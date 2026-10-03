import { useEffect, useState } from 'react';
import { dataPadrao, parseValor } from '../../lib/format';
import './GastoForm.css';

function valorInicial(gasto) {
  return gasto ? String(gasto.valor).replace('.', ',') : '';
}

/**
 * Formulário de gasto. Se `gasto` vier preenchido, edita; senão, cadastra.
 * `onSalvar` recebe { nome, valor, data_pagamento } e deve retornar uma Promise.
 */
export default function GastoForm({ gasto, mes, onSalvar, onCancelar }) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setNome(gasto?.nome ?? '');
    setValor(valorInicial(gasto));
    setData(gasto?.data_pagamento ?? dataPadrao(mes));
    setErro('');
  }, [gasto, mes]);

  async function aoEnviar(e) {
    e.preventDefault();
    const valorNumerico = parseValor(valor);
    if (!nome.trim()) return setErro('Informe o nome do gasto.');
    if (!(valorNumerico > 0)) return setErro('Informe um valor maior que zero.');
    if (!data) return setErro('Informe a data de pagamento.');

    setSalvando(true);
    setErro('');
    try {
      await onSalvar({ nome: nome.trim(), valor: valorNumerico, data_pagamento: data });
      if (!gasto) {
        setNome('');
        setValor('');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="gasto-form" onSubmit={aoEnviar} noValidate>
      <label className="campo gasto-form__nome">
        <span>Nome do gasto</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Aluguel, Energia, Cartão"
          maxLength={80}
        />
      </label>
      <label className="campo">
        <span>Valor (R$)</span>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
        />
      </label>
      <label className="campo">
        <span>Data de pagamento</span>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>

      {erro && <p className="aviso-erro gasto-form__erro">{erro}</p>}

      <div className="gasto-form__acoes">
        {gasto && (
          <button type="button" className="btn btn--secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primario" disabled={salvando}>
          {salvando ? 'Salvando…' : gasto ? 'Salvar alterações' : 'Cadastrar gasto'}
        </button>
      </div>
    </form>
  );
}
