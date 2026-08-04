# Auditoria — Migração GitHub `mmarques30` → `IAplicada-Business`

> Verificado em 2026-08-04. Objetivo: garantir que nada se perdeu na mudança de dono do repositório.

## Conclusão

A migração **já foi concluída via transferência de repositório no GitHub** (não é um fork nem um mirror novo).

| Item | Valor |
|---|---|
| Repo novo | https://github.com/IAplicada-Business/bz-advocacia |
| Repo antigo | https://github.com/mmarques30/bz-advocacia → **HTTP 301** para o mesmo `repository_id` |
| Repository ID | `1162781339` (idêntico nos dois caminhos) |
| `created_at` | `2026-02-20T17:29:00Z` (preservado) |
| Commits em `main` | 1823 |
| Branches | 19 — SHAs idênticos entre URL antiga (redirect) e nova |
| Tags | nenhuma (em ambos) |
| PRs | histórico preservado (ex.: #86–#105 listados após a transferência) |
| Issues abertas | 0 |
| GitHub Pages | não configurado |

## O que NÃO muda com a transferência do GitHub

Esses serviços não dependem do owner do repo e continuam apontando para os mesmos recursos:

| Serviço | Status |
|---|---|
| Supabase `nvkxblrwblhvggndlfax` | Intact — schema, Edge Functions e secrets ficam no projeto Supabase |
| App Lovable | https://bz-advocacia.lovable.app — projeto `1a09f2bd-c7b5-40b9-92ec-b2e20089beaa` |
| Z-API (WhatsApp) | Webhooks apontam para Edge Functions, não para o GitHub |

## Checklist pós-transferência (ações manuais)

- [x] Código + histórico no org `IAplicada-Business`
- [x] Branches remotas com os mesmos SHAs
- [x] Referências internas atualizadas (`CLAUDE.md`, `README.md`, `README_SDR.md`)
- [ ] Em cada máquina local: `git remote set-url origin https://github.com/IAplicada-Business/bz-advocacia.git`
- [ ] Lovable → Settings → GitHub: confirmar que o sync aponta para `IAplicada-Business/bz-advocacia` (após transfer, às vezes pede reautorização OAuth)
- [ ] Times/colaboradores da org: garantir acesso de quem precisa (hoje o collaborator listado via API inclui `mmarques30`)
- [ ] Secrets de GitHub Actions / Deploy keys: revalidar se algum workflow externo usava o path antigo (neste repo não há workflows em `.github/`)
- [ ] Comunicar o novo URL ao time; o redirect do GitHub cobre clones antigos por um tempo, mas o canônico é a org

## Como revalidar

```bash
# Mesmo repository id via redirect
curl -sI https://api.github.com/repos/mmarques30/bz-advocacia | grep -i location

# Branches idênticas
diff \
  <(git ls-remote --heads https://github.com/mmarques30/bz-advocacia.git | sort) \
  <(git ls-remote --heads https://github.com/IAplicada-Business/bz-advocacia.git | sort)
```

Esperado: `Location` com `repositories/1162781339` e `diff` sem saída.
