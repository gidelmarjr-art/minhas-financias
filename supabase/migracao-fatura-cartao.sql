-- Minhas Finanças — migração: ciclo da fatura do cartão de crédito.
-- Rode DEPOIS da migracao-forma-pagamento.sql. Pode rodar mais de uma vez.

-- Data real da compra no cartão (a data_pagamento passa a ser o vencimento da fatura).
alter table public.gastos
  add column if not exists data_compra date;

-- Fechamento e vencimento da fatura (uma linha por usuário).
create table if not exists public.config_cartao (
  user_id         uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  dia_fechamento  int not null default 20 check (dia_fechamento between 1 and 31),
  dia_vencimento  int not null default 27 check (dia_vencimento between 1 and 31),
  updated_at      timestamptz not null default now()
);

alter table public.config_cartao enable row level security;

drop policy if exists "config_cartao: dono tem acesso total" on public.config_cartao;
create policy "config_cartao: dono tem acesso total" on public.config_cartao
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
