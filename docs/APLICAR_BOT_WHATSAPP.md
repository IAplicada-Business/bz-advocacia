# Deploy — Bloco 3 (Bot WhatsApp)

## 1. Migration

```bash
supabase link --project-ref nvkxblrwblhvggndlfax
supabase db push
```

Inclui:
- `lead_stage = desqualificado`
- colunas `desqualificado_*`, flags de qualificação
- `qualificacao_estruturada_sdr`
- RPC `advogadas_lead_count_30d`
- seed placeholder Juliana / Eliziane (telefones TODO)

## 2. Edge Function

```bash
supabase functions deploy whatsapp-inbound --no-verify-jwt
```

## 3. Telefones reais (task 2.2)

Atualizar em `advogados_sdr` os placeholders:

```sql
UPDATE advogados_sdr SET telefone = '+55XXXXXXXXXXX' WHERE nome = 'Juliana Borges';
UPDATE advogados_sdr SET telefone = '+55XXXXXXXXXXX' WHERE nome = 'Eliziane Zembruski';
```

## 4. Validação rápida

| Cenário | Esperado |
|---------|----------|
| "preciso de pensão pro meu filho" | Política + `stage=desqualificado`, sem notificar advogada |
| "quero divórcio com partilha" | 3 perguntas Família (a–e / a–f / a–d) |
| patrimônio = e | Ticket mínimo + desqualificado |
| inventário completo | Handoff; flag `ticket_minimo` se patrimônio = a |
| saúde urgência = a | Notificação com 🚨 |

Roteiro: `docs/BZ_Bot_Whatsapp_Roteiro_v1.md`
