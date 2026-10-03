-- Minhas Finanças — migração: gastos fixos, variáveis e parcelados.
-- Para quem JÁ rodou o schema.sql anterior. Pode rodar mais de uma vez.
-- Os gastos que você já cadastrou viram "variáveis" automaticamente.

-- 1) Modelo dos gastos fixos (um registro por gasto que se repete todo mês)
create table if not exists public.gastos_fixos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome            text not null,
  valor           numeric(12,2) not null check (valor > 0),
  dia_vencimento  int not null check (dia_vencimento between 1 and 31),
  inicio_mes      date not null,   -- primeiro mês em que vale (sempre dia 01)
  fim_mes         date,            -- último mês em que vale; vazio = continua todo mês
  created_at      timestamptz not null default now()
);

-- 2) Novas colunas em gastos
alter table public.gastos
  add column if not exists tipo           text not null default 'variavel',
  add column if not exists fixo_id        uuid references public.gastos_fixos(id) on delete set null,
  add column if not exists grupo_id       uuid,   -- liga as parcelas da mesma compra
  add column if not exists parcela_numero int,
  add column if not exists parcela_total  int,
  add column if not exists mes_referencia date
    generated always as (data_pagamento - (extract(day from data_pagamento)::int - 1)) stored;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gastos_tipo_valido') then
    alter table public.gastos
      add constraint gastos_tipo_valido check (tipo in ('fixo', 'variavel', 'parcelado'));
  end if;
  -- um gasto fixo gera no máximo uma conta por mês
  if not exists (select 1 from pg_constraint where conname = 'gastos_fixo_mes_unico') then
    alter table public.gastos
      add constraint gastos_fixo_mes_unico unique (fixo_id, mes_referencia);
  end if;
end
$$;

-- 3) Índices
create index if not exists gastos_fixos_user_idx on public.gastos_fixos (user_id, inicio_mes);
create index if not exists gastos_grupo_idx      on public.gastos (grupo_id);

-- 4) Segurança
alter table public.gastos_fixos enable row level security;

drop policy if exists "gastos_fixos: dono tem acesso total" on public.gastos_fixos;
create policy "gastos_fixos: dono tem acesso total" on public.gastos_fixos
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) Atualiza o cache da API do Supabase
notify pgrst, 'reload schema';
