import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ aberto, titulo, onFechar, children }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => e.key === 'Escape' && onFechar();
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="modal__fundo"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <header className="modal__cabecalho">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={onFechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
