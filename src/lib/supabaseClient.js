import { createClient } from '@supabase/supabase-js';

function limparUrl(valor) {
  if (!valor) return '';
  try {
    return new URL(valor.trim()).origin;
  } catch {
    return '';
  }
}

const url = limparUrl(import.meta.env.VITE_SUPABASE_URL);
const chave = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigurado = Boolean(url && chave);
export const supabase = supabaseConfigurado ? createClient(url, chave) : null;
