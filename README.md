# FiscalMEI

SaaS de controle de limite de faturamento e obrigações fiscais para MEI.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind
- **Backend / Auth / DB**: Supabase
- **Pagamentos**: Asaas (Pix + cartão)
- **WhatsApp**: Evolution API ou Z-API (fase 1)
- **Hospedagem**: Vercel + Supabase

## Estrutura atual do repositório

```
fiscalmei-app/
├── src/
│   ├── app/                 # Rotas (App Router)
│   ├── components/          # Componentes React
│   ├── lib/
│   │   ├── limit.ts         # Lógica de limite + trial (pronto)
│   │   └── supabase/        # Clientes Supabase
│   └── types/
│       └── database.ts      # Tipos TypeScript
├── supabase/                # Migrations (usar o database.sql da landing)
├── .env.example
└── package.json
```

## Como começar a desenvolver

1. Crie um projeto no [Supabase](https://supabase.com)
2. Rode o arquivo `database.sql` (está na pasta `fiscalmei-landing`) no SQL Editor do Supabase
3. Copie `.env.example` para `.env.local` e preencha as chaves
4. Instale as dependências:

```bash
npm install
```

5. Rode o projeto:

```bash
npm run dev
```

## Ordem de implementação recomendada

1. **Auth + Onboarding**  
   - Cadastro/login com Supabase Auth  
   - Tela de onboarding (CNPJ + WhatsApp + dados básicos)

2. **Dashboard + Lançamentos**  
   - Barra de progresso do limite  
   - CRUD de receitas  
   - Cálculo em tempo real (já temos a função `analyzeLimit`)

3. **Sistema de Trial**  
   - Bloqueio após 15 dias  
   - Tela de upgrade

4. **Alertas de limite**  
   - Job diário ou trigger após lançamento  
   - Envio via WhatsApp

5. **Lembretes de DAS**  
   - Geração automática do DAS do mês  
   - Lembretes 5 e 1 dia antes

6. **Pagamentos**  
   - Integração Asaas  
   - Webhook de confirmação

7. **Simulador + Guias**  
   - Simulador MEI → ME  
   - Conteúdo de NFS-e e DASN

## Arquivos importantes já criados

| Arquivo | O que faz |
|---------|-----------|
| `src/lib/limit.ts` | Cálculo de percentual, status, projeção e trial |
| `src/types/database.ts` | Todos os tipos TypeScript do banco |
| `database.sql` (na landing) | Schema completo + view de faturamento anual |

## Status atual

- [x] Landing page + SEO
- [x] Modelo de pricing (15 dias grátis)
- [x] Telas do MVP definidas
- [x] Schema do banco
- [x] Lógica de limite e trial
- [ ] Auth + Onboarding
- [ ] Dashboard
- [ ] Sistema de alertas
- [ ] Integração de pagamento
