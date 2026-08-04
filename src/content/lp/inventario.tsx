import type { LpContent } from "@/components/lp/types";

export const inventarioContent: LpContent = {
  slug: "inventario",
  metaTitle: "Inventário Otimizado | Borges & Zembruski Advocacia",
  metaDescription:
    "Reduza o imposto do inventário e desatravese a partilha com estratégia. Análise gratuita do seu inventário.",
  eyebrow: "INVENTÁRIO OTIMIZADO · SUCESSÕES",
  headline: (
    <>
      Reduza o imposto do inventário em <em>até 87%</em> e destrave a partilha sem guerra na família.
    </>
  ),
  headlinePlain:
    "Reduza o imposto do inventário em até 87% e destrave a partilha sem guerra na família.",
  subheadline:
    "Inventário travado, imposto alto e herdeiros em conflito não precisam ser o destino. Montamos o mapa patrimonial e a estratégia tributária antes de qualquer passo precipitado.",
  bullets: [
    "Estratégia tributária e sucessória sob medida",
    "Atendimento em todo o Brasil",
    "Mais de 10 anos em família e sucessões",
  ],
  heroImage: "/IMG_8077_hero.jpg",
  // Foco um pouco mais baixo: mais folga acima das cabeças
  heroObjectPosition: "center 18%",
  // Anexo 3 — motion blur das sócias (CTA final inventário + divórcio)
  finalCtaImage: "/IMG_8432.jpg",
  finalCtaObjectPosition: "center 55%",
  formTitle: "Análise gratuita do seu inventário",
  formSubtitle: "Retorno em até 1 dia útil · WhatsApp",
  formFields: [
    {
      id: "situacao",
      label: "Situação do inventário",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Ainda não iniciei",
        "Já comecei e está travado",
        "Quero reduzir o imposto (ITCMD)",
        "Há conflito entre herdeiros",
        "Só quero entender as opções",
      ],
    },
    {
      id: "bens",
      label: "Patrimônio estimado",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Até R$ 500 mil",
        "R$ 500 mil a R$ 2 milhões",
        "R$ 2 milhões a R$ 5 milhões",
        "Acima de R$ 5 milhões",
        "Ainda não sei o valor",
      ],
    },
    {
      id: "herdeiros",
      label: "Número de herdeiros",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: ["1 a 2", "3 a 4", "5 ou mais", "Há herdeiro menor / incapaz"],
    },
    {
      id: "consenso",
      label: "Há consenso na família?",
      type: "select",
      required: true,
      placeholder: "Selecione",
      options: [
        "Sim, todos alinhados",
        "Parcial, há atritos",
        "Não, conflito aberto",
        "Prefiro não dizer agora",
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
      “A família <em>não consegue mover</em> nada.”
    </>
  ),
  quotes: [
    { text: "Faz dois anos e o inventário não anda. Cada um puxa pra um lado." },
    { text: "O imposto veio absurdo. Ninguém me explicou se dava pra reduzir." },
    { text: "Tem imóvel, empresa e conta que ninguém sabe o valor real." },
  ],
  mechanismHeadline: (
    <>
      Por que inventário “no automático” <em>custa caro</em> e o que fazemos diferente.
    </>
  ),
  mechanismSteps: [
    {
      number: "1",
      title: "Mapa primeiro",
      conventional: "Abrir inventário sem saber o que existe e quanto vale.",
      different: "Levantamos bens, dívidas e riscos antes de qualquer protocolo.",
    },
    {
      number: "2",
      title: "Imposto com estratégia",
      conventional: "Aceitar a base de cálculo sem questionar.",
      different: "Revisamos ITCMD e caminhos lícitos de otimização caso a caso.",
    },
    {
      number: "3",
      title: "Partilha sem guerra",
      conventional: "Deixar o conflito crescer e judicializar tudo.",
      different: "Conduzimos com mediação técnica e números claros na mesa.",
    },
  ],
  mechanismCallout:
    "Inventário Otimizado é mapa + tributo + condução familiar, não é só “abrir o processo”.",
  featuresHeadline: (
    <>
      O que está incluso no <em>Inventário Otimizado</em>
    </>
  ),
  features: [
    {
      title: "Diagnóstico patrimonial completo",
      description: "Bens, dívidas, empresas e pontos cegos do espólio.",
    },
    {
      title: "Estratégia de ITCMD",
      description: "Leitura da base de cálculo e caminhos de otimização lícita.",
    },
    {
      title: "Roteiro de documentos",
      description: "O que cada herdeiro precisa, sem idas e vindas infinitas.",
    },
    {
      title: "Condução entre herdeiros",
      description: "Comunicação estruturada para reduzir atrito e acelerar consenso.",
    },
    {
      title: "Petições e acompanhamentos",
      description: "Do protocolo aos atos finais, com status visível.",
    },
    {
      title: "Portal do cliente",
      description: "Acompanhe andamentos e pendências em tempo real.",
    },
    {
      title: "Canal direto com a advogada",
      description: "Sem fila genérica. Quem conduz o caso fala com você.",
    },
    {
      title: "Atuação nacional",
      description: "Estratégia alinhada ao foro e à realidade do espólio.",
    },
  ],
  resultMetric: "87%",
  resultLabel: "de redução no imposto",
  resultStory:
    "Espólio com avaliação inflada e inventário parado. Reorganizamos a base, alinhamos os herdeiros e a família concluiu a partilha com economia relevante de ITCMD.",
  resultAuthor: "Marina S.",
  resultRole: "Herdeira · inventário familiar",
  resultAvatarSeed: "bz-inv-marina",
  testimonials: [
    {
      name: "Marina S.",
      role: "Herdeira",
      avatarSeed: "bz-inv-marina",
      text: "Acharam caminho no imposto que nenhum contador tinha me mostrado. Processo finalmente andou.",
    },
    {
      name: "Lucas F.",
      role: "Co-herdeiro",
      avatarSeed: "bz-inv-lucas",
      text: "Irmãos brigando há anos. Elas trouxeram método e números, e saímos do impasse.",
    },
    {
      name: "Paula R.",
      role: "Inventariante",
      avatarSeed: "bz-inv-paula",
      text: "Clareza do início ao fim. Eu sabia exatamente o que faltava e o porquê de cada passo.",
    },
    {
      name: "Helena M.",
      role: "Herdeira · espólio familiar",
      avatarSeed: "bz-inv-helena",
      text: "A simulação de ITCMD mudou a conversa na família. Economizamos e o inventário saiu do limbo.",
    },
  ],
  careHeadline: (
    <>
      O que muda quando a <em>Borges & Zembruski</em> cuida de você
    </>
  ),
  careItems: [
    {
      title: "Mapa patrimonial antes de qualquer protocolo",
      description:
        "Você enxerga bens, riscos e caminhos de economia de imposto antes de gastar energia no cartório.",
    },
    {
      title: "Condução entre herdeiros com método",
      description:
        "Menos atrito, mais decisão. Facilitamos o alinhamento com números e próximos passos claros.",
    },
    {
      title: "Estratégia tributária sob medida",
      description:
        "Simulações e escolhas que cabem no seu espólio, não um modelo genérico de inventário.",
    },
    {
      title: "Acompanhamento até a partilha fechar",
      description:
        "Status, documentos e atos no mesmo ritmo. Você sabe o que falta e quem precisa agir.",
    },
  ],
  careNote:
    "Mudanças de alíquota e filas de cartório mudam o jogo. Quanto antes o mapa estiver pronto, melhor.",
  finalHeadline: (
    <>
      Descubra <em>quanto você pode economizar</em> no inventário.
    </>
  ),
  finalCta: "Quero uma análise do meu inventário",
};
