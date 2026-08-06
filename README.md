# B&Z — CRM Borges & Zembruski Advocacia

CRM jurídico + bot SDR (Cláudia) no WhatsApp.

**Live app**: https://gestao.borgesezembruski.com  
**Repo**: https://github.com/IAplicada-Business/bz-advocacia  
**Supabase**: `nvkxblrwblhvggndlfax`

## Stack

- Frontend: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + TanStack Query
- Backend: Supabase (Postgres + RLS + Edge Functions Deno)
- WhatsApp: Z-API
- Classificador: Claude Haiku

## Setup local

1. `cp .env.example .env`
2. Preencher variáveis do Supabase (URL e ANON/PUBLISHABLE KEY do painel)
3. `npm install`
4. `npm run dev`

Secrets de Edge Functions **não** vão no `.env` do front — use:

```bash
supabase link --project-ref nvkxblrwblhvggndlfax
supabase secrets set --env-file ./.env
```

## Migrations

Arquivos em `supabase/migrations/*.sql`, aplicados por ordem cronológica no nome.

```bash
supabase db push
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## Documentação útil

- `CLAUDE.md` — regras do projeto e do bot SDR
- `README_SDR.md` — overview do SDR V3
- `docs/SLA_FUNIL_COMERCIAL.md` — SLA por etapa do funil

## Desenvolvimento

```sh
git clone https://github.com/IAplicada-Business/bz-advocacia.git
cd bz-advocacia
npm i
npm run dev
```

> O painel Lovable em produção é só CRM publicado. **Não** editar código nem schema pelo Lovable — commits e sync pelo Lovable conflitam após a transferência do repo para a org.
