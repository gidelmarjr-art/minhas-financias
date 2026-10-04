-- Execute este arquivo no SQL Editor do Supabase para adicionar o histórico mensal.
create table if not exists public.gastos_passados (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mes_referencia  date not null,
  valor_total     numeric(12,2) not null check (valor_total > 0),
  observacao      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint gastos_passados_mes_inicio check (mes_referencia = date_trunc('month', mes_referencia)::date),
  constraint gastos_passados_usuario_mes_unico unique (user_id, mes_referencia)
);

create index if not exists gastos_passados_user_mes_idx on public.gastos_passados (user_id, mes_referencia desc);
alter table public.gastos_passados enable row level security;
drop policy if exists "gastos_passados: dono tem acesso total" on public.gastos_passados;
create policy "gastos_passados: dono tem acesso total" on public.gastos_passados
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
notify pgrst, 'reload schema';
