-- Minhas Finanças — migração: perfis de acesso.
--   completo = vê e usa tudo, mas só os PRÓPRIOS dados (é o que já acontece hoje)
--   geral    = só vê a aba Geral, com o total e cada pessoa separada, SOMENTE LEITURA
-- Pode rodar mais de uma vez. Quem não tem perfil cadastrado continua "completo".

create table if not exists public.perfis (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  papel       text not null default 'completo' check (papel in ('completo', 'geral')),
  nome        text not null,
  created_at  timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- Pergunta "o usuário logado é da visão geral?" sem depender das regras da própria tabela.
create or replace function public.eh_visao_geral()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and papel = 'geral');
$$;
revoke all on function public.eh_visao_geral() from public;
grant execute on function public.eh_visao_geral() to authenticated;

-- Cada um lê o próprio perfil; a visão geral lê todos (para mostrar os nomes). Ninguém altera pelo app.
drop policy if exists "perfis: lê o próprio" on public.perfis;
create policy "perfis: lê o próprio" on public.perfis
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "perfis: visão geral lê todos" on public.perfis;
create policy "perfis: visão geral lê todos" on public.perfis
  for select to authenticated using (public.eh_visao_geral());

-- Nas tabelas de dados: a visão geral LÊ tudo, mas não escreve em nada.
do $$
declare
  tabela text;
begin
  foreach tabela in array array['gastos', 'gastos_fixos', 'entradas', 'config_cartao', 'gastos_passados']
  loop
    if to_regclass('public.' || tabela) is not null then
      execute format('drop policy if exists %I on public.%I', tabela || ': visão geral só lê', tabela);
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.eh_visao_geral())',
        tabela || ': visão geral só lê', tabela);

      execute format('drop policy if exists %I on public.%I', tabela || ': visão geral não grava', tabela);
      execute format(
        'create policy %I on public.%I as restrictive for insert to authenticated with check (not public.eh_visao_geral())',
        tabela || ': visão geral não grava', tabela);

      execute format('drop policy if exists %I on public.%I', tabela || ': visão geral não altera', tabela);
      execute format(
        'create policy %I on public.%I as restrictive for update to authenticated using (not public.eh_visao_geral())',
        tabela || ': visão geral não altera', tabela);

      execute format('drop policy if exists %I on public.%I', tabela || ': visão geral não apaga', tabela);
      execute format(
        'create policy %I on public.%I as restrictive for delete to authenticated using (not public.eh_visao_geral())',
        tabela || ': visão geral não apaga', tabela);
    end if;
  end loop;
end
$$;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------------------
-- DEFINA QUEM É QUEM (troque os e-mails pelos reais e rode estas linhas):
--
-- insert into public.perfis (user_id, papel, nome)
-- select id, 'completo', 'T' from auth.users where email = 'EMAIL-DO-T@exemplo.com'
-- on conflict (user_id) do update set papel = excluded.papel, nome = excluded.nome;
--
-- insert into public.perfis (user_id, papel, nome)
-- select id, 'completo', 'G' from auth.users where email = 'EMAIL-DO-G@exemplo.com'
-- on conflict (user_id) do update set papel = excluded.papel, nome = excluded.nome;
--
-- insert into public.perfis (user_id, papel, nome)
-- select id, 'geral', 'Admin' from auth.users where email = 'EMAIL-DO-ADMIN@exemplo.com'
-- on conflict (user_id) do update set papel = excluded.papel, nome = excluded.nome;
-- ---------------------------------------------------------------------------------------
