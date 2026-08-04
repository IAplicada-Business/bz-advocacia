import type { LpContent } from "@/components/lp/types";

export const divorcioContent: LpContent = {
  slug: "divorcio",
  metaTitle: "Partilha Protegida | Borges & Zembruski Advocacia",
  metaDescription:
    "Divórcio com partilha de bens com mapa patrimonial completo. Análise gratuita do seu caso.",
  eyebrow: "PARTILHA PROTEGIDA · DIVÓRCIO COM PARTILHA DE BENS",
  headline: (
    <>
      Saia do casamento em <em>6 meses</em>, com o mapa completo do que{" "}
      <em>é seu</em>, sem depender do humor <em>dele</em>.
    </>
  ),
  headlinePlain:
    "Saia do casamento em 6 meses, com o mapa completo do que é seu, sem depender do humor dele.",
  subheadline:
    "Estratégia centrada no mapeamento patrimonial antes das negociações. Você chega preparada, com números, documentos e postura, sem pedir o que “ele achar justo”.",
  bullets: [
    "Formadas pela PUCRS",
    "Mais de 10 anos de experiência",
    "Atendimento em todo o Brasil",
  ],
  heroImage: "/IMG_8535_hero.jpg",
  // Sócias com tablet; viés à esquerda no mobile; foco um pouco mais alto
  heroObjectPosition: "38% 20%",
  // Anexo 3 — motion blur das sócias (CTA final inventário + divórcio)
  finalCtaImage: "/IMG_8432.jpg",
  finalCtaObjectPosition: "center 55%",
  formTitle: "Análise gratuita do seu caso",
  formSubtitle: "Retorno em até 1 dia útil · WhatsApp",
  formFields: [
    {
      id: "situacao",
      label: "Situação atual",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Ainda casada, quero me preparar",
        "Separação de fato / já saí de casa",
        "Divórcio em andamento",
        "Há violência / urgência de proteção",
        "Só quero entender meus direitos",
      ],
    },
    {
      id: "filhos",
      label: "Filhos",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Não temos filhos",
        "Filhos menores",
        "Filhos maiores",
        "Há disputa de guarda / visitas",
      ],
    },
    {
      id: "bens",
      label: "Bens a partilhar",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Imóvel(is)",
        "Empresa / sociedade",
        "Investimentos e contas",
        "Patrimônio misto / complexo",
        "Ainda não sei o que existe",
      ],
    },
    {
      id: "regime",
      label: "Regime de bens",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Comunhão parcial",
        "Comunhão universal",
        "Separação total",
        "Participação final nos aquestos",
        "Não sei / preciso confirmar",
      ],
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
      “É como se eu não tivesse <em>direito a nada</em>.”
    </>
  ),
  quotes: [
    { text: "Ele diz que eu não tenho direito porque quem ganha o dinheiro é ele." },
    { text: "Não sei nem quais contas existem. Tudo está no nome dele." },
    { text: "Toda vez que tento conversar, ele muda de assunto ou me ameaça." },
  ],
  mechanismHeadline: (
    <>
      Por que <em>sentar e conversar primeiro</em> é o pior conselho.
    </>
  ),
  mechanismSteps: [
    {
      number: "1",
      title: "Mapear antes",
      conventional: "Negociar no escuro, aceitando a versão dele dos fatos.",
      different: "Levantamos patrimônio, sinais de ocultação e regime de bens primeiro.",
    },
    {
      number: "2",
      title: "Chegar com números",
      conventional: "Pedir “o que for justo” sem base objetiva.",
      different: "Você senta na mesa com mapa, provas e proposta matemática.",
    },
    {
      number: "3",
      title: "Proteger o caminho",
      conventional: "Aceitar pressão emocional e prazos dele.",
      different: "Conduzimos com urgências, medidas e ritmo definidos por estratégia.",
    },
  ],
  mechanismCallout:
    "Partilha Protegida é chegar preparada. Conversar sem mapa é negociar em desvantagem.",
  featuresHeadline: (
    <>
      O que está incluso na <em>Partilha Protegida</em>
    </>
  ),
  features: [
    {
      title: "Diagnóstico patrimonial completo",
      description: "O que é seu, o que é comum e o que precisa ser investigado.",
    },
    {
      title: "Auditoria de indícios de ocultação",
      description: "Sinais de bens e valores que não aparecem na conversa.",
    },
    {
      title: "Estratégia de divórcio e partilha",
      description: "Sequência de atos, riscos e próximos passos claros.",
    },
    {
      title: "Medidas urgentes quando necessário",
      description: "Proteção patrimonial e pessoal conforme o caso.",
    },
    {
      title: "Portal do cliente com status",
      description: "Acompanhe andamentos e pendências em tempo real.",
    },
    {
      title: "Canal direto com a advogada responsável",
      description: "Comunicação direta, sem intermediário genérico.",
    },
    {
      title: "Orientação para não se prejudicar",
      description: "O que não assinar, o que não falar e o que documentar.",
    },
    {
      title: "Atuação em todo o Brasil",
      description: "Estratégia alinhada ao foro e à realidade do casal.",
    },
  ],
  resultMetric: "100%",
  resultLabel: "do patrimônio mapeado",
  resultStory:
    "Cliente descobriu contas e participação societária que não haviam sido mencionadas. Com o mapa completo, a partilha saiu do “achismo” e foi para números.",
  resultAuthor: "Mariana C.",
  resultRole: "Cliente · partilha com mapa completo",
  resultAvatarSeed: "bz-div-mariana",
  testimonials: [
    {
      name: "Mariana C.",
      role: "Partilha com mapa",
      avatarSeed: "bz-div-mariana",
      text: "Pela primeira vez alguém me disse o que eu podia exigir, com prova, não com esperança.",
    },
    {
      name: "Renata S.",
      role: "Divórcio litigioso",
      avatarSeed: "bz-div-renata",
      text: "Eu achava que não tinha direito a nada. O mapa mudou completamente a conversa.",
    },
    {
      name: "Fernanda L.",
      role: "Partilha consensual",
      avatarSeed: "bz-div-fernanda",
      text: "Processo organizado, humanas e firmes. Saí do casamento com clareza e dignidade.",
    },
    {
      name: "Beatriz N.",
      role: "Partilha com bens ocultos",
      avatarSeed: "bz-div-beatriz",
      text: "Descobrimos o que não estava na mesa. Cheguei preparada e a partilha foi nos meus termos.",
    },
  ],
  careHeadline: (
    <>
      O que muda quando a <em>Borges & Zembruski</em> cuida de você
    </>
  ),
  careItems: [
    {
      title: "Mapa do que é seu antes de negociar",
      description:
        "Você chega à conversa com números e documentos, não pedindo o que “ele achar justo”.",
    },
    {
      title: "Olho em indícios de ocultação",
      description:
        "Varremos sinais de bens e valores que não aparecem na narrativa do outro lado.",
    },
    {
      title: "Estratégia firme, tom humano",
      description:
        "Postura clara do que exigir, do que não assinar e de como se proteger no processo.",
    },
    {
      title: "Acompanhamento próximo até a partilha",
      description:
        "Uma advogada responsável, status visível e próximos passos sem você precisar cobrar.",
    },
  ],
  careNote:
    "Aceitamos poucos casos por mês para manter qualidade e acompanhamento próximo.",
  finalHeadline: (
    <>
      Chega de esperar <em>ele decidir</em> o que é seu.
    </>
  ),
  finalCta: "Quero uma análise do meu caso",
};
