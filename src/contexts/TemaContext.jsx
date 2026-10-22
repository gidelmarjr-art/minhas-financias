import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CHAVE = 'minhas-financias:tema';
const PADRAO = 'escuro';
const COR_DA_BARRA = { escuro: '#0b0b0c', claro: '#e8e7e0' };

const TemaContext = createContext(null);

function temaSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo === 'claro' || salvo === 'escuro' ? salvo : PADRAO;
  } catch {
    return PADRAO;
  }
}

function aplicar(tema) {
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_DA_BARRA[tema]);
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    /* sem armazenamento: o tema vale só nesta visita */
  }
}

/**
 * Tema escuro (padrão) ou claro. Na troca, um círculo se abre a partir do botão clicado
 * (View Transitions); em navegadores sem esse recurso, as cores mudam suavemente.
 */
export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || temaSalvo());

  const alternar = useCallback(
    (evento) => {
      const novo = tema === 'escuro' ? 'claro' : 'escuro';
      const raiz = document.documentElement;
      const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!reduzido && document.startViewTransition) {
        const caixa = evento?.currentTarget?.getBoundingClientRect();
        const x = caixa ? caixa.left + caixa.width / 2 : window.innerWidth / 2;
        const y = caixa ? caixa.top + caixa.height / 2 : window.innerHeight / 2;
        const raio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

        const transicao = document.startViewTransition(() => {
          aplicar(novo);
          setTema(novo);
        });
        transicao.ready
          .then(() =>
            raiz.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
              { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
            ),
          )
          .catch(() => {});
        return;
      }

      if (!reduzido) {
        raiz.classList.add('tema-transicao');
        window.setTimeout(() => raiz.classList.remove('tema-transicao'), 520);
      }
      aplicar(novo);
      setTema(novo);
    },
    [tema],
  );

  const valor = useMemo(() => ({ tema, alternar }), [tema, alternar]);
  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);
