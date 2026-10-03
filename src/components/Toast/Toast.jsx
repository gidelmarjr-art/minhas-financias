import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(null);

  const avisar = useCallback((mensagem, tipo = 'ok') => {
    clearTimeout(temporizador.current);
    setAviso({ mensagem, tipo });
    temporizador.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast__area" role="status" aria-live="polite">
        {aviso && <div className={`toast toast--${aviso.tipo}`}>{aviso.mensagem}</div>}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
