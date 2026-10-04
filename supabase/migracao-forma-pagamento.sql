-- Minhas Finanças — migração: forma de pagamento (débito, crédito ou manual).
-- Rode DEPOIS da migracao-tipos-de-gasto.sql. Pode rodar mais de uma vez.
-- Tudo o que já existe vira "manual" (você continua confirmando um a um, como antes).

alter table public.gastos
  add column if not exists forma_pagamento text not null default 'manual';

alter table public.gastos_fixos
  add column if not exists forma_pagamento text not null default 'manual',
  add column if not exists banco text;   -- banco do débito automático (só quando a forma é débito)

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gastos_forma_valida') then
    alter table public.gastos
      add constraint gastos_forma_valida check (forma_pagamento in ('debito', 'credito', 'manual'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gastos_fixos_forma_valida') then
    alter table public.gastos_fixos
      add constraint gastos_fixos_forma_valida
      check (forma_pagamento in ('debito', 'credito', 'manual')
             and (forma_pagamento <> 'debito' or banco is not null));
  end if;
end
$$;

create index if not exists gastos_forma_idx on public.gastos (user_id, forma_pagamento, pago);

notify pgrst, 'reload schema';
