-- MULTIUSUÁRIO: execute uma única vez no SQL Editor do Supabase.
-- 1. Perfis: todos os usuários existentes se tornam UsuarioG; novos entram como UsuarioT.
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default 'Thiago',
  papel text not null default 'usuario_t' check (papel in ('usuario_g', 'usuario_t', 'admin')),
  created_at timestamptz not null default now()
);

insert into public.perfis (id, nome, papel)
select id, coalesce(raw_user_meta_data->>'nome', 'Júnior'), 'usuario_g'
from auth.users
on conflict (id) do nothing;

create or replace function public.criar_perfil_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, papel)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', 'Thiago'), 'usuario_t')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario_perfil on auth.users;
create trigger ao_criar_usuario_perfil after insert on auth.users
for each row execute procedure public.criar_perfil_usuario();

create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin');
$$;

alter table public.perfis enable row level security;
drop policy if exists "perfis: leitura própria ou admin" on public.perfis;
create policy "perfis: leitura própria ou admin" on public.perfis for select to authenticated
using (id = auth.uid() or public.eh_admin());

-- 2. Substitui as políticas antigas: usuários comuns só enxergam os próprios dados;
-- Admin enxerga tudo, mas NÃO tem políticas de insert, update ou delete.
drop policy if exists "gastos_fixos: dono tem acesso total" on public.gastos_fixos;
drop policy if exists "gastos: dono tem acesso total" on public.gastos;
drop policy if exists "entradas: dono tem acesso total" on public.entradas;
drop policy if exists "config_cartao: dono tem acesso total" on public.config_cartao;
drop policy if exists "gastos_passados: dono tem acesso total" on public.gastos_passados;

-- Também remove políticas criadas por uma execução anterior incompleta desta migração.
drop policy if exists "gastos_fixos: leitura dono ou admin" on public.gastos_fixos;
drop policy if exists "gastos: leitura dono ou admin" on public.gastos;
drop policy if exists "entradas: leitura dono ou admin" on public.entradas;
drop policy if exists "config_cartao: leitura dono ou admin" on public.config_cartao;
drop policy if exists "gastos_passados: leitura dono ou admin" on public.gastos_passados;
drop policy if exists "gastos_fixos: escrita só dono" on public.gastos_fixos;
drop policy if exists "gastos: escrita só dono" on public.gastos;
drop policy if exists "entradas: escrita só dono" on public.entradas;
drop policy if exists "config_cartao: escrita só dono" on public.config_cartao;
drop policy if exists "gastos_passados: escrita só dono" on public.gastos_passados;

create policy "gastos_fixos: leitura dono ou admin" on public.gastos_fixos for select to authenticated using (user_id = auth.uid() or public.eh_admin());
create policy "gastos: leitura dono ou admin" on public.gastos for select to authenticated using (user_id = auth.uid() or public.eh_admin());
create policy "entradas: leitura dono ou admin" on public.entradas for select to authenticated using (user_id = auth.uid() or public.eh_admin());
create policy "config_cartao: leitura dono ou admin" on public.config_cartao for select to authenticated using (user_id = auth.uid() or public.eh_admin());
create policy "gastos_passados: leitura dono ou admin" on public.gastos_passados for select to authenticated using (user_id = auth.uid() or public.eh_admin());

create policy "gastos_fixos: escrita só dono" on public.gastos_fixos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "gastos: escrita só dono" on public.gastos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "entradas: escrita só dono" on public.entradas for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "config_cartao: escrita só dono" on public.config_cartao for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "gastos_passados: escrita só dono" on public.gastos_passados for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

notify pgrst, 'reload schema';
