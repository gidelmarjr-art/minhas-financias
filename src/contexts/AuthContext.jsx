import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { definirSomenteLeitura } from '../lib/acesso';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [perfil, setPerfil] = useState(null); // { usuario, papel, nome }

  useEffect(() => {
    if (!supabase) {
      setCarregandoSessao(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregandoSessao(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSessao(nova));
    return () => data.subscription.unsubscribe();
  }, []);

  // Descobre se esta conta é "completo" (padrão) ou "geral" (só a aba Geral, somente leitura).
  const usuarioId = sessao?.user?.id ?? null;
  useEffect(() => {
    if (!supabase || !usuarioId) {
      definirSomenteLeitura(false);
      setPerfil(null);
      return undefined;
    }
    let ativo = true;
    supabase
      .from('perfis')
      .select('papel, nome')
      .eq('user_id', usuarioId)
      .maybeSingle()
      .then(({ data }) => {
        if (!ativo) return;
        const papel = data?.papel === 'geral' ? 'geral' : 'completo';
        definirSomenteLeitura(papel === 'geral'); // antes de qualquer tela buscar dados
        setPerfil({ usuario: usuarioId, papel, nome: data?.nome ?? '' });
      });
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  const perfilPronto = !usuarioId || perfil?.usuario === usuarioId;

  const valor = useMemo(
    () => ({
      sessao,
      carregando: carregandoSessao || !perfilPronto,
      somenteGeral: perfil?.papel === 'geral',
      nomeDoPerfil: perfil?.nome ?? '',
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
    [sessao, carregandoSessao, perfilPronto, perfil],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
