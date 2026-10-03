import { createContext, useContext, useMemo, useState } from 'react';
import { deslocarMes, mesAtual } from '../lib/format';

const MesContext = createContext(null);

export function MesProvider({ children }) {
  const [mes, setMes] = useState(mesAtual());

  const valor = useMemo(
    () => ({
      mes,
      setMes,
      anterior: () => setMes((m) => deslocarMes(m, -1)),
      proximo: () => setMes((m) => deslocarMes(m, 1)),
      hoje: () => setMes(mesAtual()),
    }),
    [mes],
  );

  return <MesContext.Provider value={valor}>{children}</MesContext.Provider>;
}

export const useMes = () => useContext(MesContext);
