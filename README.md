# Minhas Finanças

Dashboard responsivo (React + Vite) para controlar as contas mês a mês, com login por senha e banco no Supabase.

## Abas

- **Geral** — quanto entrou no mês, quanto está em dívida, quanto já foi pago, saldo previsto e próximos pagamentos.
- **Cadastro de gastos** — três abas:
  - *Gastos fixos*: repetem todo mês até você encerrar (nome, valor e dia do vencimento).
  - *Gastos variáveis*: valem só para o mês da data de pagamento.
  - *Compras parceladas*: valor da parcela, nº de parcelas e data da 1ª; uma parcela entra em cada mês.
- **Confirmar pagamento** — marca a conta como paga com a data do pagamento e o banco usado (e permite desfazer).

## Como rodar

1. `npm install`
2. No Supabase, abra **SQL Editor** e rode `supabase/schema.sql` (instalação nova) ou, se já tinha rodado a
   versão anterior, `supabase/migracao-tipos-de-gasto.sql`.
3. Em **Authentication → Users**, crie o seu usuário (e-mail + senha). Desative o cadastro público em
   **Authentication → Providers → Email → Allow new users to sign up** para ninguém mais criar conta.
4. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API).
5. `npm run dev`

## Estrutura

```
src/
├── App.jsx / main.jsx / index.css   rotas, entrada e tokens globais
├── components/                      cada componente na sua pasta (.jsx + .css)
│                                    (inclui Abas, ListaGastos e ExclusaoModal)
├── layouts/DashboardLayout/
├── pages/                           Login, Geral, CadastroGastos, ConfirmarPagamento
├── contexts/                        AuthContext (sessão) e MesContext (mês selecionado)
├── services/                        chamadas ao Supabase (gastos, gastos fixos, entradas)
├── hooks/                           useGastos, useEntradas
└── lib/                             supabaseClient e funções de formatação
```

## Deploy

Como o app usa rotas (`/geral`, `/gastos`…), configure o host (Vercel, Netlify…) para redirecionar
todas as rotas para `index.html`.
