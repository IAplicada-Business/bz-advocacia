import type { LpContent } from "@/components/lp/types";

export const saudeContent: LpContent = {
  slug: "saude",
  metaTitle: "Cobertura Garantida | Borges & Zembruski Advocacia",
  metaDescription:
    "Análise gratuita da negativa do plano de saúde. Especialistas em Direito da Saúde com atendimento em todo o Brasil.",
  eyebrow: "Cobertura Garantida · Direito da Saúde",
  headline: (
    <>
      Garanta o tratamento do seu familiar sem depender da autorização do{" "}
      <em>plano</em>.
    </>
  ),
  headlinePlain: "Garanta o tratamento do seu familiar sem depender da autorização do plano.",
  subheadline:
    "Quando o plano nega medicamento, cirurgia ou internação, cada dia conta. Atuamos com urgência para destravar a cobertura — com estratégia jurídica clara desde o primeiro contato.",
  bullets: [
    "Especialistas em Direito da Saúde",
    "Atendimento em todo o Brasil",
    "Desde 2019 com foco em planos de saúde",
  ],
  heroImage: "/IMG_8287.jpg",
  finalCtaImage: "/IMG_8379.jpg",
  formTitle: "Análise gratuita da negativa",
  formSubtitle: "Resposta em até 1 dia útil · WhatsApp",
  formFields: [
    {
      id: "situacao",
      label: "Situação atual",
      type: "select",
      required: true,
      placeholder: "O que aconteceu?",
      options: [
        "Plano negou medicamento",
        "Plano negou cirurgia / procedimento",
        "Plano negou internação / UTI",
        "Demora excessiva na autorização",
        "Outra negativa de cobertura",
      ],
    },
    {
      id: "cobertura",
      label: "Tipo de cobertura",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Medicamento de alto custo",
        "Cirurgia eletiva / urgência",
        "Internação hospitalar",
        "Tratamento contínuo / home care",
        "Exames / diagnóstico",
      ],
    },
    {
      id: "urgencia",
      label: "Urgência clínica",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Urgência extrema (risco imediato)",
        "Alta (precisa em dias)",
        "Média (próximas semanas)",
        "Ainda avaliando opções",
      ],
    },
    {
      id: "plano",
      label: "Operadora / plano",
      type: "text",
      required: true,
      placeholder: "Ex.: Unimed, Bradesco, SulAmérica…",
    },
    {
      id: "contato",
      label: "Nome e WhatsApp",
      type: "text",
      required: true,
      placeholder: "Seu nome e DDD + número",
    },
  ],
  formCta: "Quero uma análise do meu caso →",
  problemEyebrow: "O que a gente ouve todo dia",
  problemHeadline: (
    <>
      “O plano negou. E <em>agora</em>?”
    </>
  ),
  quotes: [
    {
      text: "Meu pai precisa do medicamento e o plano disse que não cobre. Não sei por onde começar.",
    },
    {
      text: "A cirurgia está marcada e a autorização não sai. Estamos no limite.",
    },
    {
      text: "Já tentei de tudo no 0800. Só recebo protocolo e nenhuma solução.",
    },
  ],
  mechanismHeadline: (
    <>
      Por que <em>40% das liminares</em> são descumpridas. E o que fazer diferente.
    </>
  ),
  mechanismSteps: [
    {
      number: "1",
      title: "Diagnóstico real",
      conventional: "Advogado genérico pede liminar sem mapear a negativa.",
      different: "Lemos a negativa, o contrato e o quadro clínico antes de qualquer petição.",
    },
    {
      number: "2",
      title: "Tutela com dentes",
      conventional: "Pedido fraco, sem multa diária nem execução prevista.",
      different: "Estruturamos tutela com multa e plano de execução se o plano descumprir.",
    },
    {
      number: "3",
      title: "Acompanhamento",
      conventional: "Ganha a liminar e some — o plano atrasa de novo.",
      different: "Monitoramos cumprimento e acionamos execução assim que houver atraso.",
    },
  ],
  mechanismCallout:
    "Cobertura Garantida não é só ganhar a liminar. É fazer o plano cumprir — com estratégia, prazo e pressão.",
  featuresHeadline: (
    <>
      O que está incluso na <em>Cobertura Garantida</em>
    </>
  ),
  features: [
    {
      title: "Análise jurídica do caso em 48h úteis",
      description: "Leitura da negativa, documentos médicos e viabilidade processual.",
    },
    {
      title: "Pedido de tutela de urgência",
      description: "Estratégia pensada para destravar o tratamento o quanto antes.",
    },
    {
      title: "Multa diária bem calibrada",
      description: "Pedido de astreintes coerente com a urgência clínica.",
    },
    {
      title: "Execução automática da multa",
      description: "Se o plano descumprir, seguimos para execução sem você precisar cobrar.",
    },
    {
      title: "Canal direto com a advogada responsável",
      description: "Comunicação clara, sem intermediários genéricos.",
    },
    {
      title: "Portal do cliente com status",
      description: "Acompanhe andamentos e próximos passos em tempo real.",
    },
    {
      title: "Orientação para família e cuidadores",
      description: "O que reunir, o que evitar dizer ao plano e como documentar.",
    },
    {
      title: "Atuação em todo o Brasil",
      description: "Estratégia pensada para o foro e a operadora do seu caso.",
    },
  ],
  resultMetric: "R$ 90k",
  resultLabel: "em tratamento liberado",
  resultStory:
    "Família com negativa de medicamento de alto custo. Em menos de uma semana após a tutela, o plano autorizou o tratamento sob multa diária — e cumpriu.",
  testimonials: [
    {
      name: "A.M.",
      text: "Eu estava desesperada com a negativa. Elas foram diretas, humanas e resolveram o que o plano enrolava há meses.",
    },
    {
      name: "R.T.",
      text: "Pela primeira vez senti que alguém lia o laudo de verdade. A liminar saiu e o plano cumpriu.",
    },
    {
      name: "C.P.",
      text: "Atendimento impecável. Explicaram cada passo sem juridiquês e acompanharam até o fim.",
    },
  ],
  bonusesHeadline: "Bônus empilhados pra quem entra ainda esta semana",
  bonuses: [
    {
      badge: "Semana atual",
      title: "Prioridade na análise",
      description: "Seu caso entra na fila prioritária de triagem clínica-jurídica.",
    },
    {
      badge: "Se entrar esta semana",
      title: "Checklist de documentos",
      description: "Roteiro pronto do que pedir ao hospital e ao plano — sem retrabalho.",
    },
    {
      badge: "Padrão",
      title: "Portal do cliente",
      description: "Acesso ao acompanhamento digital do caso desde o onboarding.",
    },
  ],
  urgencyBar:
    "Casos de urgência clínica extrema têm prioridade absoluta na triagem — fale conosco hoje.",
  finalHeadline: (
    <>
      Cada dia sem tratamento é <em>um dia a mais</em> de risco.
    </>
  ),
  finalCta: "Quero uma análise do meu caso",
};
