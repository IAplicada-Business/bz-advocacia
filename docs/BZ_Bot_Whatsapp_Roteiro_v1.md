# BZ Bot WhatsApp — Roteiro de Mensagens v1

> Fonte de verdade das mensagens do bot (textos, ordem, cadência, regras).
> Implementado a partir dos prompts 2.1–2.5 do plano de execução.
> **Não inventar texto no código:** usar exatamente o que está aqui.

Emojis no bot (legado do código atual): `💙` e `😊` em mensagens de fluxo geral.
Nas mensagens de política/desqualificação abaixo: **sem emoji**, texto literal.

---

## 1. Exclusão — Pensão / Guarda isolados (task 2.1)

**Quando:** lead menciona SOMENTE pensão alimentícia ou SOMENTE guarda, sem partilha/divórcio.

**Mensagem:**

```
Olá! Obrigada por entrar em contato. Nosso escritório hoje é especializado em Divórcio com Partilha de Bens, Inventário e Direito da Saúde. Para casos isolados de pensão alimentícia ou guarda, indicamos que procure um profissional especializado. Se sua situação envolver também partilha de bens ou divórcio, é só me contar mais e a gente segue.
```

**Ação:** `stage = desqualificado`, `desqualificado_motivo = pensao_guarda_only`. Sem handoff.

---

## 2. Qualificação Família — Divórcio + Partilha (task 2.3)

Fazer **uma pergunta por mensagem**, na ordem, aguardando resposta.

### Pergunta A (situacao)
Qual sua situação hoje?
- (a) Ainda casado(a), pensando em me separar
- (b) Já separado(a), sem processo iniciado
- (c) Divórcio em negociação
- (d) Divórcio em andamento
- (e) Processo travado

### Pergunta B (patrimonio)
Existe patrimônio a partilhar?
- (a) Sim, imóveis
- (b) Sim, empresa
- (c) Sim, aplicações
- (d) Sim, mais de um tipo
- (e) Não há patrimônio significativo
- (f) Não tenho certeza

### Pergunta C (renda)
Qual sua renda familiar mensal?
- (a) Até R$10k
- (b) R$10k a R$30k
- (c) R$30k a R$60k
- (d) Acima de R$60k

**Persistência:** `qualificacao_estruturada_sdr.respostas_familia` =
`{ situacao, patrimonio, renda }`

**Regras após C:**
- Se `patrimonio = e` → desqualificar `ticket_minimo`
- Se `renda = a` e `patrimonio ∈ (e, f)` → desqualificar `ticket_minimo`
- Senão → handoff Família (task 2.2)

**Mensagem ticket mínimo:**

```
Nosso trabalho é focado em partilha, então nesse caso o volume da causa é limitado. Recomendamos entrar em contato pelo formulário do site pra encaixar em pacote específico
```

---

## 3. Qualificação Inventário (task 2.4 — placeholder até B&Z devolver 5.2)

### Pergunta A (fase)
Em que fase está o inventário?
- (a) Falecimento recente, ainda não abrimos
- (b) Inventário aberto, em andamento
- (c) Inventário travado com problemas
- (d) Buscando planejamento sucessório preventivo

### Pergunta B (patrimonio)
Estimativa do patrimônio do espólio?
- (a) Até R$300k
- (b) R$300k-R$1M
- (c) R$1M-R$5M
- (d) Acima de R$5M
- (e) Não sei estimar

### Pergunta C (composicao)
Composição do patrimônio?
- (a) Só imóveis
- (b) Imóveis + empresa
- (c) Imóveis + aplicações
- (d) Empresa + aplicações
- (e) Complexo (múltiplos)
- (f) Inclui bens exterior
- (g) Não sei

### Pergunta D (conflito)
Existe risco de conflito entre herdeiros?
- (a) Sim, já há divergências
- (b) Talvez, ainda não conversamos
- (c) Não, todos alinhados

**Regras:**
- `patrimonio = a` → flag `ticket_minimo` (segue handoff)
- `fase = d` → flag `produto_diferente` (segue handoff com nota)

---

## 4. Qualificação Saúde (task 2.5 — placeholder até B&Z devolver 5.3)

### Pergunta A (plano)
Situação atual com o plano?
- (a) Plano negou por escrito
- (b) Plano negou verbalmente
- (c) Plano autorizou mas não cumpre
- (d) Plano está enrolando
- (e) Ainda não pedi, mas sei que vou precisar

### Pergunta B (cobertura)
Tipo de cobertura em questão?
- (a) Cirurgia
- (b) Medicamento alto custo
- (c) Home care
- (d) Tratamento oncológico
- (e) Terapia continuada
- (f) UTI/internação
- (g) Exame alta complexidade
- (h) Outro

### Pergunta C (urgencia)
Urgência clínica?
- (a) Extrema — risco de vida ou piora rápida
- (b) Precisa começar em até 30 dias
- (c) Sem urgência imediata

### Pergunta D (valor_plano)
Valor mensal do plano de saúde?
- (a) Até R$500
- (b) R$500-R$1500
- (c) R$1500-R$3000
- (d) Acima de R$3000

**Regras:**
- `urgencia = a` → `prioridade_max` + notificar advogada com 🚨
- `plano = a` → flag `caso_forte`

---

## 5. Handoff (task 2.2)

Round-robin entre advogadas ativas com a área na coluna `areas` de `advogados_sdr`.

**Template notificação (Família):**

```
Novo lead qualificado: {nome}, {telefone}. Divórcio + Partilha. Ver detalhes: gestao.borgesezembruski.com/dashboard/leads/{leadId}
```

**Template urgência extrema (Saúde):** prefixar com `🚨 `.
