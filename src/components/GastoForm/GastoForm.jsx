import { useEffect, useState } from 'react';
import { dataMaisMeses, dataPadrao, moeda, parseValor, rotuloMes } from '../../lib/format';
import './GastoForm.css';

function diaInicial(gasto, mes) {
  if (gasto?.fixo?.dia_vencimento) return String(gasto.fixo.dia_vencimento);
  const data = gasto?.data_pagamento ?? dataPadrao(mes);
  return String(Number(data.slice(8, 10)));
}

/**
 * Formulário de gasto. `tipo`: 'fixo' | 'variavel' | 'parcelado'.
 * Se `gasto` vier preenchido, edita; senão, cadastra.
 *
 * `onSalvar` recebe, conforme o caso:
 *  - fixo:                   { nome, valor, dia_vencimento }
 *  - variável:               { nome, valor, data_pagamento }
 *  - parcelado (novo):       { nome, valor, parcelas, primeira_data }
 *  - parcelado (editando):   { nome, valor, data_pagamento }
 */
export default function GastoForm({ tipo, gasto, mes, onSalvar, onCancelar }) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [dia, setDia] = useState('');
  const [parcelas, setParcelas] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const novoParcelado = tipo === 'parcelado' && !gasto;

  useEffect(() => {
    setNome(gasto?.nome ?? '');
    setValor(gasto ? String(gasto.valor).replace('.', ',') : '');
    setData(gasto?.data_pagamento ?? dataPadrao(mes));
    setDia(diaInicial(gasto, mes));
    setParcelas('');
    setErro('');
  }, [gasto, mes, tipo]);

  const valorNumerico = parseValor(valor);
  const qtd = Number(parcelas);
  const previa =
    novoParcelado && valorNumerico > 0 && Number.isInteger(qtd) && qtd >= 2 && data
      ? `${qtd}x de ${moeda(valorNumerico)} = ${moeda(valorNumerico * qtd)}. Última parcela em ${rotuloMes(
          dataMaisMeses(data, qtd - 1).slice(0, 7),
        )}.`
      : '';

  async function aoEnviar(e) {
    e.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome do gasto.');
    if (!(valorNumerico > 0)) return setErro('Informe um valor maior que zero.');

    let payload;
    if (tipo === 'fixo') {
      const diaNumero = Number(dia);
      if (!Number.isInteger(diaNumero) || diaNumero < 1 || diaNumero > 31) {
        return setErro('Informe um dia de vencimento entre 1 e 31.');
      }
      payload = { nome: nome.trim(), valor: valorNumerico, dia_vencimento: diaNumero };
    } else if (novoParcelado) {
      if (!Number.isInteger(qtd) || qtd < 2 || qtd > 60) {
        return setErro('Informe o número de parcelas, de 2 a 60.');
      }
      if (!data) return setErro('Informe a data da primeira parcela.');
      payload = { nome: nome.trim(), valor: valorNumerico, parcelas: qtd, primeira_data: data };
    } else {
      if (!data) return setErro('Informe a data de pagamento.');
      payload = { nome: nome.trim(), valor: valorNumerico, data_pagamento: data };
    }

    setSalvando(true);
    setErro('');
    try {
      await onSalvar(payload);
      if (!gasto) {
        setNome('');
        setValor('');
        setParcelas('');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const textoBotao = salvando
    ? 'Salvando…'
    : gasto
      ? 'Salvar alterações'
      : { fixo: 'Cadastrar gasto fixo', variavel: 'Cadastrar gasto variável', parcelado: 'Cadastrar compra parcelada' }[tipo];

  return (
    <form
      className={`gasto-form ${novoParcelado ? 'gasto-form--quatro' : ''}`}
      onSubmit={aoEnviar}
      noValidate
    >
      <label className="campo gasto-form__nome">
        <span>Nome do gasto</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={
            tipo === 'fixo' ? 'Ex.: Aluguel, Internet' : tipo === 'parcelado' ? 'Ex.: Geladeira, Celular' : 'Ex.: Mercado, Farmácia'
          }
          maxLength={80}
        />
      </label>

      <label className="campo">
        <span>{novoParcelado ? 'Valor da parcela (R$)' : 'Valor (R$)'}</span>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
        />
      </label>

      {novoParcelado && (
        <label className="campo">
          <span>Nº de parcelas</span>
          <input
            type="number"
            min="2"
            max="60"
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
            placeholder="Ex.: 10"
            inputMode="numeric"
          />
        </label>
      )}

      {tipo === 'fixo' ? (
        <label className="campo">
          <span>Dia do vencimento</span>
          <input
            type="number"
            min="1"
            max="31"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            inputMode="numeric"
          />
        </label>
      ) : (
        <label className="campo">
          <span>{novoParcelado ? 'Data da 1ª parcela' : 'Data de pagamento'}</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      )}

      {previa && <p className="gasto-form__previa">{previa}</p>}
      {erro && <p className="aviso-erro gasto-form__erro">{erro}</p>}

      <div className="gasto-form__acoes">
        {gasto && (
          <button type="button" className="btn btn--secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primario" disabled={salvando}>
          {textoBotao}
        </button>
      </div>
    </form>
  );
}
