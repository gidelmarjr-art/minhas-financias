import { supabase } from '../lib/supabaseClient';

/** Pessoas com acesso completo (só a visão geral consegue ler todas). */
export async function listarPessoas() {
  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, nome, papel')
    .eq('papel', 'completo')
    .order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
