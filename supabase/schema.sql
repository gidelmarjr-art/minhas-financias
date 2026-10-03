-- Minhas Finanças — rode este arquivo no SQL Editor do Supabase.

create table if not exists public.gastos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome            text not null,
  valor           numeric(12,2) not null check (valor > 0),
  data_pagamento  date not null,                 -- vencimento
  pago            boolean not null default false,
  data_pago       date,                          -- quando foi pago
  banco           text,                          -- de qual banco saiu
  created_at      timestamptz not null default now(),
  constraint pagamento_completo check (pago = false or (data_pago is not null and banco is not null))
);

create table if not exists public.entradas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  descricao     text not null,
  valor         numeric(12,2) not null check (valor > 0),
  data_entrada  date not null,
  created_at    timestamptz not null default now()
);

create index if not exists gastos_user_data_idx   on public.gastos (user_id, data_pagamento);
create index if not exists entradas_user_data_idx on public.entradas (user_id, data_entrada);

-- Cada usuário só enxerga e altera os próprios dados.
alter table public.gastos   enable row level security;
alter table public.entradas enable row level security;

create policy "gastos: dono tem acesso total" on public.gastos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entradas: dono tem acesso total" on public.entradas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
