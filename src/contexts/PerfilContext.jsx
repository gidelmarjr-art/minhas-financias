import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const PerfilContext = createContext(null);

export function PerfilProvider({ children }) {
  const { sessao } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [alvoAdmin, setAlvoAdmin] = useState('todos');

  useEffect(() => {
    if (!sessao) { setPerfil(null); setUsuarios([]); setCarregandoPerfil(false); return; }
    setCarregandoPerfil(true);
    Promise.all([
      supabase.from('perfis').select('*').eq('id', sessao.user.id).single(),
      supabase.from('perfis').select('*').in('papel', ['usuario_g', 'usuario_t']).order('papel'),
    ]).then(([meu, lista]) => {
      if (!meu.error) setPerfil(meu.data);
      if (!lista.error) setUsuarios(lista.data);
    }).finally(() => setCarregandoPerfil(false));
  }, [sessao]);

  const valor = useMemo(() => ({
    perfil,
    usuarios,
    carregandoPerfil,
    isAdmin: perfil?.papel === 'admin',
    alvoAdmin,
    setAlvoAdmin,
    userIdVisualizado: alvoAdmin === 'todos' ? null : alvoAdmin,
  }), [perfil, usuarios, carregandoPerfil, alvoAdmin]);
  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}

export const usePerfil = () => useContext(PerfilContext);
