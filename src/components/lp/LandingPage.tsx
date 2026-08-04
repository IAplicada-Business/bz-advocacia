import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Quote, Star } from "lucide-react";
import { LpHeader } from "./LpHeader";
import { LpFooter } from "./LpFooter";
import { LpLeadForm } from "./LpLeadForm";
import { useLpMotion } from "./useLpMotion";
import { lpAvatarUrl } from "./avatar";
import type { LpContent } from "./types";

type LandingPageProps = {
  content: LpContent;
};

export function LandingPage({ content }: LandingPageProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  useLpMotion();

  useEffect(() => {
    document.title = content.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", content.metaDescription);
  }, [content]);

  // Carrossel automático dos depoimentos
  useEffect(() => {
    const total = content.testimonials.length;
    if (total < 2 || carouselPaused) return;
    const id = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % total);
    }, 4500);
    return () => window.clearInterval(id);
  }, [content.testimonials.length, carouselPaused]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToNext = () => {
    const folds = document.querySelectorAll<HTMLElement>("[data-fold]");
    folds[1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectTestimonial = (index: number) => {
    setActiveTestimonial(index);
    // Pausa breve após clique manual, depois o auto retomará
    setCarouselPaused(true);
    window.setTimeout(() => setCarouselPaused(false), 7000);
  };

  const featured = content.testimonials[activeTestimonial] ?? content.testimonials[0];

  return (
    <div className="lp-theme min-h-screen bg-lp-cream font-sans text-lp-ink antialiased">
      <LpHeader onCtaClick={scrollToForm} />

      {/* 1. HERO — foto full-bleed; só object-position mexe o enquadramento */}
      <section data-fold className="relative min-h-[100svh] overflow-hidden">
        <img
          data-lp-hero-img
          src={content.heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-[0.58]"
          style={{ objectPosition: content.heroObjectPosition ?? "center 8%" }}
        />
        {/* Gradiente só da esquerda; sem véu no topo que esconde a cabeça */}
        <div className="absolute inset-0 bg-gradient-to-r from-lp-cream from-[0%] via-lp-cream/82 via-[40%] to-transparent to-[75%]" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-lp-cream/45 to-transparent" />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col justify-center px-5 pb-16 pt-24 md:px-10 md:pb-20 md:pt-28 lg:px-14">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)] lg:gap-10 xl:gap-14">
            <div data-reveal className="lp-reveal lp-reveal-left w-full max-w-[40rem] justify-self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-gold md:text-xs">
                {content.eyebrow}
              </p>
              <h1 className="mt-5 font-seasons text-[2.65rem] font-medium leading-[1.1] text-lp-ink md:text-[3.25rem] lg:text-[3.7rem]">
                {content.headline}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-lp-muted md:text-[1.08rem]">
                {content.subheadline}
              </p>
              <ul className="mt-8 space-y-3.5">
                {content.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm text-lp-ink/85 md:text-[15px]">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lp-gold/15 text-lp-gold">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div
              ref={formRef}
              id="analise"
              data-reveal
              className="lp-reveal lp-reveal-right lp-reveal-delay w-full scroll-mt-28 lg:justify-self-end"
            >
              <LpLeadForm
                title={content.formTitle}
                subtitle={content.formSubtitle}
                fields={content.formFields}
                cta={content.formCta}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToNext}
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-lp-ink/35 transition hover:text-lp-gold md:bottom-8"
            aria-label="Ir para a próxima seção"
          >
            <span className="text-[10px] uppercase tracking-[0.24em]">Continuar</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* 2. PROBLEMA */}
      <section data-fold className="lp-fold bg-lp-stone px-5 md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-6xl">
          <p
            data-reveal
            className="lp-reveal text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-gold"
          >
            {content.problemEyebrow}
          </p>
          <h2
            data-reveal
            className="lp-reveal lp-reveal-scale mx-auto mt-6 max-w-3xl text-center font-seasons text-[2.25rem] leading-tight md:text-4xl lg:text-[3rem]"
          >
            {content.problemHeadline}
          </h2>
          <div data-reveal className="lp-reveal mt-16 grid gap-7 md:mt-20 md:grid-cols-3 md:gap-8">
            {content.quotes.map((quote) => (
              <article
                key={quote.text}
                data-stagger
                className="flex min-h-[240px] flex-col rounded-2xl border border-lp-ink/5 bg-white px-7 py-9 shadow-sm md:min-h-[280px] md:px-8 md:py-10"
              >
                <Quote className="h-7 w-7 text-lp-gold" strokeWidth={1.5} />
                <p className="mt-6 flex-1 font-seasons text-[1.35rem] leading-snug text-lp-ink/90 md:text-[1.5rem]">
                  “{quote.text}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MECANISMO */}
      <section data-fold className="lp-fold bg-white px-5 md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal lp-reveal-scale mx-auto max-w-3xl text-center font-seasons text-[2.25rem] leading-tight md:text-4xl lg:text-[3rem]"
          >
            {content.mechanismHeadline}
          </h2>
          <div data-reveal className="lp-reveal mt-16 grid gap-7 md:mt-20 md:grid-cols-3 md:gap-8">
            {content.mechanismSteps.map((step) => (
              <article
                key={step.number}
                data-stagger
                className="flex min-h-[320px] flex-col rounded-2xl border border-lp-ink/8 bg-lp-cream/55 p-7 md:min-h-[380px] md:p-9"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-lp-gold/55 font-seasons text-2xl text-lp-gold">
                  {step.number}
                </div>
                <h3 className="mt-7 font-seasons text-[1.75rem] md:text-[1.9rem]">{step.title}</h3>
                <div className="mt-6 flex-1 space-y-5 text-sm leading-relaxed md:text-[15px]">
                  <p className="text-lp-muted">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-lp-ink/40">
                      Caminho comum
                    </span>
                    {step.conventional}
                  </p>
                  <p className="text-lp-ink/85">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-lp-gold">
                      O que fazemos diferente
                    </span>
                    {step.different}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <blockquote
            data-reveal
            className="lp-reveal lp-reveal-scale mt-14 rounded-2xl bg-lp-gold/15 px-7 py-9 text-center font-seasons text-[1.45rem] leading-snug text-lp-ink md:mt-16 md:px-14 md:py-11 md:text-[2rem]"
          >
            “{content.mechanismCallout}”
          </blockquote>
        </div>
      </section>

      {/* 4. INCLUSO */}
      <section data-fold className="lp-fold bg-lp-ink px-5 text-white md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal lp-reveal-scale mx-auto max-w-3xl text-center font-seasons text-[2.25rem] leading-tight md:text-4xl lg:text-[3rem]"
          >
            {content.featuresHeadline}
          </h2>
          <div data-reveal className="lp-reveal mt-16 grid gap-x-14 gap-y-12 md:mt-20 md:grid-cols-2">
            {content.features.map((feature) => (
              <div key={feature.title} data-stagger className="flex gap-5">
                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lp-gold/15 text-lp-gold">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-wide md:text-lg">{feature.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/58 md:text-[15px]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROVA SOCIAL — interativa com avatares */}
      <section data-fold className="lp-fold bg-lp-cream px-5 md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-6xl">
          <div className="grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <article
              data-reveal
              className="lp-reveal lp-reveal-left flex flex-col justify-between rounded-[1.75rem] border border-lp-ink/5 bg-white p-8 shadow-sm md:p-10"
            >
              <div className="flex items-center gap-4">
                <img
                  src={lpAvatarUrl(content.resultAvatarSeed)}
                  alt=""
                  className="h-16 w-16 rounded-full bg-lp-stone object-cover ring-2 ring-lp-gold/35"
                />
                <div>
                  <p className="text-sm font-semibold text-lp-ink">{content.resultAuthor}</p>
                  {content.resultRole ? (
                    <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-lp-muted">
                      {content.resultRole}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-8">
                <p className="font-seasons text-5xl leading-none text-lp-gold md:text-6xl lg:text-7xl">
                  {content.resultMetric}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-lp-muted md:text-sm">
                  {content.resultLabel}
                </p>
                <p className="mt-6 text-base leading-relaxed text-lp-ink/80 md:text-lg">
                  {content.resultStory}
                </p>
              </div>
            </article>

            <div
              data-reveal
              className="lp-reveal lp-reveal-right flex flex-col rounded-[1.75rem] border border-lp-ink/5 bg-white p-6 shadow-sm md:p-8"
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lp-gold">
                O que clientes dizem
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {content.testimonials.map((item, index) => (
                  <button
                    key={item.avatarSeed}
                    type="button"
                    onClick={() => selectTestimonial(index)}
                    aria-label={`Ver depoimento de ${item.name}`}
                    aria-pressed={activeTestimonial === index}
                    className={`relative overflow-hidden rounded-full transition ${
                      activeTestimonial === index
                        ? "ring-2 ring-lp-gold ring-offset-2 ring-offset-white"
                        : "opacity-55 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={lpAvatarUrl(item.avatarSeed)}
                      alt={item.name}
                      className="h-12 w-12 bg-lp-stone object-cover md:h-14 md:w-14"
                    />
                  </button>
                ))}
              </div>

              {featured ? (
                <div key={featured.avatarSeed} className="mt-8 flex flex-1 flex-col">
                  <div className="flex gap-1 text-lp-gold">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-5 flex-1 font-seasons text-[1.35rem] leading-snug text-lp-ink transition-opacity duration-500 md:text-[1.55rem]">
                    “{featured.text}”
                  </blockquote>
                  <div className="mt-8 border-t border-lp-ink/8 pt-5">
                    <p className="text-sm font-semibold text-lp-ink">{featured.name}</p>
                    {featured.role ? (
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-lp-muted">
                        {featured.role}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex gap-1.5" aria-hidden>
                    {content.testimonials.map((item, index) => (
                      <span
                        key={`dot-${item.avatarSeed}`}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          activeTestimonial === index ? "w-6 bg-lp-gold" : "w-1.5 bg-lp-ink/15"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CUIDADO B&Z — o que você recebe (sem “bônus da semana”) */}
      <section data-fold className="lp-fold bg-white px-5 md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-5xl">
          <h2
            data-reveal
            className="lp-reveal lp-reveal-scale mx-auto max-w-3xl text-center font-seasons text-[2.25rem] leading-tight md:text-4xl lg:text-[2.85rem]"
          >
            {content.careHeadline}
          </h2>

          <div
            data-reveal
            className="lp-reveal mt-14 divide-y divide-lp-ink/8 border-y border-lp-ink/8 md:mt-16"
          >
            {content.careItems.map((item, index) => (
              <div
                key={item.title}
                data-stagger
                className="grid gap-3 py-7 md:grid-cols-[3.5rem_1fr] md:items-start md:gap-8 md:py-8"
              >
                <span className="font-seasons text-2xl text-lp-gold md:text-[1.75rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-seasons text-xl text-lp-ink md:text-2xl">{item.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-lp-muted md:text-[15px]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p
            data-reveal
            className="lp-reveal mt-10 text-center text-sm leading-relaxed text-lp-ink/65 md:mt-12 md:text-[15px]"
          >
            <span className="text-lp-gold">✱</span> {content.careNote}
          </p>
        </div>
      </section>

      {/* 7. CTA FINAL — faixa curta, texto/botão centralizados (padrão LP Saúde) */}
      <section data-fold className="relative overflow-hidden px-5 py-16 md:px-8 md:py-20">
        <img
          src={content.finalCtaImage}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{
            objectPosition: content.finalCtaObjectPosition ?? "center 40%",
          }}
        />
        <div className="absolute inset-0 bg-lp-ink/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/70 via-lp-ink/50 to-lp-ink/45" />
        <div
          data-reveal
          className="lp-reveal lp-reveal-scale relative mx-auto flex max-w-2xl flex-col items-center justify-center py-6 text-center text-white"
        >
          <h2 className="font-seasons text-[1.85rem] leading-tight md:text-3xl lg:text-[2.35rem]">
            {content.finalHeadline}
          </h2>
          <button
            type="button"
            onClick={scrollToForm}
            className="mt-7 rounded-full bg-lp-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-lp-ink transition hover:bg-lp-gold-soft"
          >
            {content.finalCta}
          </button>
        </div>
      </section>

      <LpFooter />
    </div>
  );
}
