-- Minhas Finanças — schema completo (instalação nova).
-- Cole tudo no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez.
-- Se você já tinha rodado uma versão anterior, use as migrações, nesta ordem:
--   1) migracao-tipos-de-gasto.sql   2) migracao-forma-pagamento.sql   3) migracao-fatura-cartao.sql

-- 1) Gastos fixos: modelo que se repete todo mês até ser encerrado
create table if not exists public.gastos_fixos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome            text not null,
  valor           numeric(12,2) not null check (valor > 0),
  dia_vencimento  int not null check (dia_vencimento between 1 and 31),
  inicio_mes      date not null,
  fim_mes         date,
  forma_pagamento text not null default 'manual',
  banco           text,            -- banco do débito automático (só quando a forma é débito)
  created_at      timestamptz not null default now(),
  constraint gastos_fixos_forma_valida
    check (forma_pagamento in ('debito', 'credito', 'manual')
           and (forma_pagamento <> 'debito' or banco is not null))
);

-- 2) Gastos: uma linha por conta de cada mês (fixa, variável ou parcela)
create table if not exists public.gastos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome            text not null,
  valor           numeric(12,2) not null check (valor > 0),
  data_pagamento  date not null,
  data_compra     date,                       -- compra no cartão: data real (data_pagamento = vencimento da fatura)
  tipo            text not null default 'variavel',
  forma_pagamento text not null default 'manual',   -- debito (já pago), credito (fatura) ou manual
  fixo_id         uuid references public.gastos_fixos(id) on delete set null,
  grupo_id        uuid,
  parcela_numero  int,
  parcela_total   int,
  mes_referencia  date generated always as (data_pagamento - (extract(day from data_pagamento)::int - 1)) stored,
  pago            boolean not null default false,
  data_pago       date,
  banco           text,
  created_at      timestamptz not null default now(),
  constraint gastos_tipo_valido check (tipo in ('fixo', 'variavel', 'parcelado')),
  constraint gastos_forma_valida check (forma_pagamento in ('debito', 'credito', 'manual')),
  constraint gastos_fixo_mes_unico unique (fixo_id, mes_referencia),
  constraint pagamento_completo check (pago = false or (data_pago is not null and banco is not null))
);

-- 3) Entradas: dinheiro que entrou
create table if not exists public.entradas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  descricao     text not null,
  valor         numeric(12,2) not null check (valor > 0),
  data_entrada  date not null,
  created_at    timestamptz not null default now()
);

-- 4) Cartão de crédito: fechamento e vencimento da fatura (uma linha por usuário)
create table if not exists public.config_cartao (
  user_id         uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  dia_fechamento  int not null default 20 check (dia_fechamento between 1 and 31),
  dia_vencimento  int not null default 27 check (dia_vencimento between 1 and 31),
  updated_at      timestamptz not null default now()
);

-- 5) Índices
create index if not exists gastos_user_data_idx   on public.gastos (user_id, data_pagamento);
create index if not exists gastos_user_pago_idx   on public.gastos (user_id, pago, data_pagamento);
create index if not exists gastos_grupo_idx       on public.gastos (grupo_id);
create index if not exists gastos_forma_idx       on public.gastos (user_id, forma_pagamento, pago);
create index if not exists gastos_fixos_user_idx  on public.gastos_fixos (user_id, inicio_mes);
create index if not exists entradas_user_data_idx on public.entradas (user_id, data_entrada);

-- 6) Segurança: cada usuário só enxerga e altera os próprios dados
alter table public.gastos_fixos enable row level security;
alter table public.gastos       enable row level security;
alter table public.entradas     enable row level security;
alter table public.config_cartao enable row level security;

drop policy if exists "gastos_fixos: dono tem acesso total" on public.gastos_fixos;
create policy "gastos_fixos: dono tem acesso total" on public.gastos_fixos
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gastos: dono tem acesso total" on public.gastos;
create policy "gastos: dono tem acesso total" on public.gastos
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entradas: dono tem acesso total" on public.entradas;
create policy "entradas: dono tem acesso total" on public.entradas
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "config_cartao: dono tem acesso total" on public.config_cartao;
create policy "config_cartao: dono tem acesso total" on public.config_cartao
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
