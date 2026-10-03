import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCarregando(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSessao(nova));
    return () => data.subscription.unsubscribe();
  }, []);

  const valor = useMemo(
    () => ({
      sessao,
      carregando,
      entrar: async (email, senha) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          console.error('Erro de login:', error);
          if (error.message === 'Email not confirmed') {
            throw new Error('E-mail ainda não confirmado. Confirme o usuário no painel do Supabase.');
          }
          if (error.message === 'Invalid login credentials') {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw new Error(error.message);
        }
      },
      sair: () => supabase.auth.signOut(),
    }),
    [sessao, carregando],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);