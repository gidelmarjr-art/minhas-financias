import { useEffect, useState } from 'react';
import SeletorBanco from '../SeletorBanco/SeletorBanco';
import SeletorForma from '../SeletorForma/SeletorForma';
import { useCartao } from '../../contexts/CartaoContext';
import {
  dataCurta,
  dataMaisMeses,
  dataPadrao,
  moeda,
  parseValor,
  rotuloMes,
  vencimentoDaFatura,
} from '../../lib/format';
import './GastoForm.css';

const FORMAS_PERMITIDAS = {
  fixo: ['debito', 'credito', 'manual'],
  variavel: ['debito', 'credito', 'manual'],
  parcelado: ['credito', 'manual'],
};
const FORMA_PADRAO = { fixo: 'manual', variavel: 'debito', parcelado: 'credito' };

function diaInicial(gasto, mes) {
  if (gasto?.fixo?.dia_vencimento) return String(gasto.fixo.dia_vencimento);
  const data = gasto?.data_pagamento ?? dataPadrao(mes);
  return String(Number(data.slice(8, 10)));
}

/**
 * Formulário de gasto. `tipo`: 'fixo' | 'variavel' | 'parcelado'.
 * Se `gasto` vier preenchido, edita; senão, cadastra.
 *
 * `onSalvar` recebe, conforme o caso (sempre com forma_pagamento e banco):
 *  - fixo:                   { nome, valor, dia_vencimento }
 *  - variável:               { nome, valor, data_pagamento }
 *  - parcelado (novo):       { nome, valor, parcelas, primeira_data }
 *  - parcelado (editando):   { nome, valor, data_pagamento }
 */
export default function GastoForm({ tipo, gasto, mes, onSalvar, onCancelar }) {
  const { cartao, abrirConfig } = useCartao();
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [dia, setDia] = useState('');
  const [parcelas, setParcelas] = useState('');
  const [forma, setForma] = useState(FORMA_PADRAO[tipo]);
  const [banco, setBanco] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const novoParcelado = tipo === 'parcelado' && !gasto;
  // Em gasto fixo já cadastrado a forma não muda (ele já gerou contas para os próximos meses).
  const formaEditavel = !(tipo === 'fixo' && gasto);

  useEffect(() => {
    setNome(gasto?.nome ?? '');
    setValor(gasto ? String(gasto.valor).replace('.', ',') : '');
    setData(gasto?.data_compra ?? gasto?.data_pagamento ?? dataPadrao(mes));
    setDia(diaInicial(gasto, mes));
    setParcelas('');
    setForma(gasto?.forma_pagamento ?? FORMA_PADRAO[tipo]);
    setBanco(gasto?.forma_pagamento === 'debito' ? (gasto.banco ?? '') : '');
    setErro('');
  }, [gasto, mes, tipo]);

  const valorNumerico = parseValor(valor);
  const qtd = Number(parcelas);
  const noCredito = forma === 'credito';
  const vencimento = noCredito && data ? vencimentoDaFatura(data, cartao) : '';
  const previa =
    novoParcelado && valorNumerico > 0 && Number.isInteger(qtd) && qtd >= 2 && data
      ? `${qtd}x de ${moeda(valorNumerico)} = ${moeda(valorNumerico * qtd)}. Última parcela ${
          noCredito ? 'na fatura de' : 'em'
        } ${rotuloMes(dataMaisMeses(noCredito ? vencimento : data, qtd - 1).slice(0, 7))}.`
      : '';

  let textoFatura = '';
  if (noCredito) {
    const ciclo = `fecha dia ${cartao.dia_fechamento}, vence dia ${cartao.dia_vencimento}`;
    if (tipo === 'fixo') textoFatura = `Entra uma vez em cada fatura do cartão (${ciclo}).`;
    else if (vencimento) {
      textoFatura = `${novoParcelado ? 'A 1ª parcela entra' : 'Esta compra entra'} na fatura que vence em ${dataCurta(vencimento)} (${ciclo}).`;
    }
    if (textoFatura && !cartao.salvo) textoFatura += ' Confira se esses dias são os do seu cartão.';
  }

  async function aoEnviar(e) {
    e.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome do gasto.');
    if (!(valorNumerico > 0)) return setErro('Informe um valor maior que zero.');
    if (formaEditavel && forma === 'debito' && !banco.trim()) {
      return setErro('Escolha o banco do débito.');
    }

    const pagamento = { forma_pagamento: forma, banco: forma === 'debito' ? banco.trim() : null };
    let payload;
    if (tipo === 'fixo') {
      const diaNumero = Number(dia);
      if (!Number.isInteger(diaNumero) || diaNumero < 1 || diaNumero > 31) {
        return setErro('Informe um dia de vencimento entre 1 e 31.');
      }
      payload = { nome: nome.trim(), valor: valorNumerico, dia_vencimento: diaNumero, ...pagamento };
    } else if (novoParcelado) {
      if (!Number.isInteger(qtd) || qtd < 2 || qtd > 60) {
        return setErro('Informe o número de parcelas, de 2 a 60.');
      }
      if (!data) return setErro('Informe a data da primeira parcela.');
      payload = {
        nome: nome.trim(),
        valor: valorNumerico,
        parcelas: qtd,
        primeira_data: data,
        ...pagamento,
      };
    } else {
      if (!data) return setErro('Informe a data de pagamento.');
      payload = { nome: nome.trim(), valor: valorNumerico, data_pagamento: data, ...pagamento };
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

  const rotuloData =
    forma === 'debito' || forma === 'credito'
      ? 'Data da compra'
      : novoParcelado
        ? 'Data da 1ª parcela'
        : 'Data de pagamento';

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
          <span>{noCredito ? 'Dia da cobrança no cartão' : 'Dia do vencimento'}</span>
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
          <span>{rotuloData}</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      )}

      <div className="gasto-form__linha">
        <SeletorForma
          valor={forma}
          onChange={setForma}
          permitidas={FORMAS_PERMITIDAS[tipo]}
          desabilitado={!formaEditavel}
        />
        {!formaEditavel && (
          <p className="gasto-form__nota">
            Para mudar a forma de pagamento de um gasto fixo, encerre-o e cadastre de novo.
          </p>
        )}
      </div>

      {textoFatura && (
        <div className="gasto-form__fatura">
          <p>{textoFatura}</p>
          <button type="button" className="gasto-form__link" onClick={abrirConfig}>
            Ajustar cartão
          </button>
        </div>
      )}

      {formaEditavel && forma === 'debito' && (
        <div className="gasto-form__banco">
          <SeletorBanco
            key={`${gasto?.id ?? 'novo'}-${tipo}`}
            valor={banco}
            onChange={setBanco}
            rotulo="Banco do débito"
          />
        </div>
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
