import type { LpContent } from "@/components/lp/types";

export const saudeContent: LpContent = {
  slug: "saude",
  metaTitle: "Cobertura Garantida | Borges & Zembruski Advocacia",
  metaDescription:
    "Análise gratuita de negativas de plano de saúde e do SUS. Especialistas em Direito da Saúde com atendimento em todo o Brasil.",
  eyebrow: "COBERTURA GARANTIDA · DIREITO DA SAÚDE",
  headline: (
    <>
      Garanta o tratamento do seu familiar sem depender da autorização do{" "}
      <em>plano</em>.
    </>
  ),
  headlinePlain: "Garanta o tratamento do seu familiar sem depender da autorização do plano.",
  subheadline:
    "Quando o plano ou o SUS nega medicamento, cirurgia ou internação, cada dia conta. Atuamos com urgência em negativas de planos de saúde e também do SUS, com estratégia jurídica clara desde o primeiro contato.",
  bullets: [
    "Especialistas em Direito da Saúde",
    "Negativas de planos de saúde e do SUS",
    "Atendimento em todo o Brasil",
  ],
  heroImage: "/IMG_8379_hero.jpg",
  // Asset landscape com folga acima da cabeça
  heroObjectPosition: "center 8%",
  finalCtaImage: "/IMG_8432.jpg",
  finalCtaObjectPosition: "center 40%",
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
        "SUS negou medicamento / procedimento",
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
      label: "Plano ou SUS",
      type: "text",
      required: true,
      placeholder: "Ex.: Unimed, Bradesco, SUS…",
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
      conventional: "Ganha a liminar e some e o plano atrasa de novo.",
      different: "Monitoramos cumprimento e acionamos execução assim que houver atraso.",
    },
  ],
  mechanismCallout:
    "Cobertura Garantida não é só ganhar a liminar. É fazer o plano cumprir, com estratégia, prazo e pressão.",
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
    "Família com negativa de medicamento de alto custo. Em menos de uma semana após a tutela, o plano autorizou o tratamento sob multa diária, e cumpriu.",
  resultAuthor: "Ana M.",
  resultRole: "Filha · medicamento de alto custo",
  resultAvatarSeed: "bz-saude-ana",
  testimonials: [
    {
      name: "Ana M.",
      role: "Filha do paciente",
      avatarSeed: "bz-saude-ana",
      text: "Eu estava desesperada com a negativa. Elas foram diretas, humanas e resolveram o que o plano enrolava há meses.",
    },
    {
      name: "Roberto T.",
      role: "Esposo · cirurgia autorizada",
      avatarSeed: "bz-saude-roberto",
      text: "Pela primeira vez senti que alguém lia o laudo de verdade. A liminar saiu e o plano cumpriu.",
    },
    {
      name: "Carla P.",
      role: "Cuidadora da família",
      avatarSeed: "bz-saude-carla",
      text: "Atendimento impecável. Explicaram cada passo sem juridiquês e acompanharam até o fim.",
    },
    {
      name: "Juliana S.",
      role: "Mãe · internação liberada",
      avatarSeed: "bz-saude-juliana",
      text: "Em 48 horas já tínhamos caminho claro. O plano liberou a internação e eu voltei a dormir.",
    },
  ],
  careHeadline: (
    <>
      O que muda quando a <em>Borges & Zembruski</em> cuida de você
    </>
  ),
  careItems: [
    {
      title: "Uma advogada responsável pelo seu caso",
      description:
        "Você fala com quem conduz a estratégia. Sem fila genérica, sem sumiço depois da liminar.",
    },
    {
      title: "Clareza do primeiro ao último passo",
      description:
        "Sabe o que estamos pedindo, por quê, e o que acontece se o plano descumprir.",
    },
    {
      title: "Pressão até o tratamento sair",
      description:
        "Não basta ganhar no papel. Acompanhamos o cumprimento e acionamos execução quando preciso.",
    },
    {
      title: "Familiares e cuidadores no mesmo mapa",
      description:
        "Orientação prática do que reunir, o que evitar dizer ao plano e como documentar sem se perder.",
    },
  ],
  careNote:
    "Urgência clínica extrema tem prioridade na triagem. Se cada dia conta, fale conosco hoje.",
  finalHeadline: (
    <>
      Cada dia sem tratamento é <em>um dia a mais</em> de risco.
    </>
  ),
  finalCta: "Quero uma análise do meu caso",
};
