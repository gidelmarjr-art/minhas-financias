import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/Toast/Toast';
import { useGastosPassados } from '../../hooks/useGastosPassados';
import * as gastosPassadosService from '../../services/gastosPassadosService';
import { deslocarMes, mesAtual, moeda, parseValor, rotuloMes } from '../../lib/format';
import './GastosPassados.css';

export default function GastosPassados() {
  const { avisar } = useToast();
  const { gastosPassados, carregando, erro, recarregar } = useGastosPassados();
  const [mesPassado, setMesPassado] = useState(deslocarMes(mesAtual(), -1));
  const [valorTotal, setValorTotal] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const valor = parseValor(valorTotal);
    if (!mesPassado || mesPassado >= mesAtual()) return setErroForm('Escolha um mês anterior ao mês atual.');
    if (!(valor > 0)) return setErroForm('Informe um valor maior que zero.');
    setSalvando(true); setErroForm('');
    try {
      await gastosPassadosService.salvar({ mes_referencia: mesPassado, valor_total: valor, observacao: observacao.trim() });
      avisar(`Histórico de ${rotuloMes(mesPassado)} salvo.`);
      setValorTotal(''); setObservacao('');
      recarregar();
    } catch (err) { setErroForm(err.message); }
    finally { setSalvando(false); }
  }

  function editar(item) {
    setMesPassado(item.mes_referencia.slice(0, 7));
    setValorTotal(String(item.valor_total));
    setObservacao(item.observacao || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remover(item) {
    if (!window.confirm(`Excluir o histórico de ${rotuloMes(item.mes_referencia.slice(0, 7))}?`)) return;
    try { await gastosPassadosService.excluir(item.id); avisar('Histórico excluído.'); recarregar(); }
    catch (err) { avisar(err.message, 'erro'); }
  }

  return (
    <div className="gastos-passados">
      <PageHeader titulo="Gastos Passados" descricao="Registre os totais anteriores para usar como base nas suas análises." />
      <div className="gastos-passados__grid">
        <section className="painel gastos-passados__formulario">
          <h2>Registrar mês anterior</h2>
          <p>Se o mês já existir, o novo salvamento atualiza seus dados.</p>
          <form onSubmit={handleSubmit} className="form-passados" noValidate>
            <label className="campo"><span>Mês de referência</span><input type="month" value={mesPassado} max={deslocarMes(mesAtual(), -1)} onChange={(e) => setMesPassado(e.target.value)} required /></label>
            <label className="campo"><span>Total gasto (R$)</span><input inputMode="decimal" placeholder="0,00" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} required /></label>
            <label className="campo"><span>Observações</span><textarea rows="4" placeholder="Ex.: viagem, despesas inesperadas…" value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength="240" /></label>
            {erroForm && <p className="aviso-erro">{erroForm}</p>}
            <button type="submit" className="btn btn--primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar histórico'}</button>
          </form>
        </section>
        <section className="painel gastos-passados__lista" aria-busy={carregando}>
          <header><div><h2>Histórico cadastrado</h2><p>{gastosPassados.length} {gastosPassados.length === 1 ? 'mês registrado' : 'meses registrados'}</p></div></header>
          {erro && <p className="aviso-erro">Não foi possível carregar o histórico: {erro}</p>}
          {!carregando && !erro && gastosPassados.length === 0 ? <EmptyState titulo="Ainda não há histórico" descricao="Registre um mês anterior para começar sua base." /> : (
            <ul>{gastosPassados.map((item) => <li key={item.id} className="gastos-passados__item"><div><strong>{rotuloMes(item.mes_referencia.slice(0, 7))}</strong>{item.observacao && <small>{item.observacao}</small>}</div><span className="numero">{moeda(item.valor_total)}</span><button type="button" className="btn btn--secundario btn--icone" onClick={() => editar(item)} aria-label="Editar histórico"><Pencil size={15} /></button><button type="button" className="btn btn--perigo btn--icone" onClick={() => remover(item)} aria-label="Excluir histórico"><Trash2 size={15} /></button></li>)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
