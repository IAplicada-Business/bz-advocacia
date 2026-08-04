import { useEffect, useRef } from "react";
import { Check, ChevronDown, Quote, Star } from "lucide-react";
import { LpHeader } from "./LpHeader";
import { LpFooter } from "./LpFooter";
import { LpLeadForm } from "./LpLeadForm";
import { useLpMotion } from "./useLpMotion";
import type { LpContent } from "./types";

type LandingPageProps = {
  content: LpContent;
};

export function LandingPage({ content }: LandingPageProps) {
  const formRef = useRef<HTMLDivElement>(null);
  useLpMotion();

  useEffect(() => {
    document.title = content.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", content.metaDescription);
  }, [content]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="lp-theme min-h-screen bg-lp-cream font-sans text-lp-ink antialiased">
      <LpHeader onCtaClick={scrollToForm} />

      {/* HERO — foto nítida à direita, texto escuro à esquerda (ref Drive) */}
      <section className="relative overflow-hidden px-5 pb-10 pt-24 md:px-8 md:pb-16 md:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(197,160,89,0.14),_transparent_55%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div data-reveal className="lp-reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-gold md:text-xs">
              — {content.eyebrow}
            </p>
            <h1 className="mt-4 font-seasons text-[2.4rem] font-medium leading-[1.12] text-lp-ink md:text-5xl lg:text-[3.25rem]">
              {content.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-lp-muted md:text-lg">
              {content.subheadline}
            </p>
            <ul className="mt-7 space-y-3">
              {content.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-lp-ink/85 md:text-[15px]">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lp-gold/15 text-lp-gold">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 rounded-full bg-lp-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-lp-ink/90"
              >
                {content.formCta.replace(" →", "")}
              </button>
              <p className="text-xs text-lp-muted">Análise gratuita · retorno em até 1 dia útil</p>
            </div>
          </div>

          <div data-reveal className="lp-reveal lp-reveal-delay relative">
            <div className="lp-hero-frame relative overflow-hidden rounded-[1.75rem] bg-lp-stone shadow-lp">
              <img
                src={content.heroImage}
                alt={content.headlinePlain}
                className="lp-hero-img aspect-[4/5] w-full object-cover sm:aspect-[5/6] lg:aspect-[4/5]"
                style={{ objectPosition: content.heroObjectPosition ?? "center 30%" }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-lp-ink/35 to-transparent" />
            </div>
            <div className="absolute -bottom-3 left-4 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-lp-ink shadow-sm backdrop-blur md:left-6">
              Borges & Zembruski
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToForm}
          className="mx-auto mt-12 flex flex-col items-center gap-1 text-lp-ink/40 transition hover:text-lp-gold"
          aria-label="Ir para o formulário"
        >
          <span className="text-[10px] uppercase tracking-[0.24em]">Continuar</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      {/* FORM — dobra própria, full contraste */}
      <section ref={formRef} id="analise" className="scroll-mt-24 bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div data-reveal className="lp-reveal lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-gold">
              — Análise gratuita
            </p>
            <h2 className="mt-3 font-seasons text-3xl leading-tight md:text-4xl">
              Conte o essencial nesse momento. <em>Nós retornamos.</em>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-lp-muted md:text-base">
              Sem compromisso. Usamos as respostas só para priorizar e preparar a conversa com a
              advogada responsável.
            </p>
          </div>
          <div data-reveal className="lp-reveal lp-reveal-delay">
            <LpLeadForm
              title={content.formTitle}
              subtitle={content.formSubtitle}
              fields={content.formFields}
              cta={content.formCta}
            />
          </div>
        </div>
      </section>

      {/* Problem quotes */}
      <section className="bg-lp-stone px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p
            data-reveal
            className="lp-reveal text-center text-[11px] uppercase tracking-[0.28em] text-lp-gold"
          >
            {content.problemEyebrow}
          </p>
          <h2
            data-reveal
            className="lp-reveal mx-auto mt-4 max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl lg:text-[2.75rem]"
          >
            {content.problemHeadline}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.quotes.map((quote, i) => (
              <article
                key={quote.text}
                data-reveal
                className="lp-reveal rounded-2xl border border-lp-ink/5 bg-white px-6 py-7 shadow-sm"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <Quote className="h-6 w-6 text-lp-gold" strokeWidth={1.5} />
                <p className="mt-4 font-seasons text-xl leading-snug text-lp-ink/90">
                  “{quote.text}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mechanism */}
      <section className="bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal mx-auto max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl lg:text-[2.75rem]"
          >
            {content.mechanismHeadline}
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {content.mechanismSteps.map((step, i) => (
              <article
                key={step.number}
                data-reveal
                className="lp-reveal rounded-2xl border border-lp-ink/8 bg-lp-cream/60 p-6 md:p-7"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-lp-gold/50 font-seasons text-xl text-lp-gold">
                  {step.number}
                </div>
                <h3 className="mt-5 font-seasons text-2xl">{step.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-lp-muted">
                  <span className="font-medium text-lp-ink/70">Caminho comum: </span>
                  {step.conventional}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-lp-ink/85">
                  <span className="font-medium text-lp-gold">O que fazemos diferente: </span>
                  {step.different}
                </p>
              </article>
            ))}
          </div>
          <blockquote
            data-reveal
            className="lp-reveal mt-10 rounded-2xl bg-lp-gold/15 px-6 py-6 text-center font-seasons text-xl leading-snug text-lp-ink md:px-10 md:text-2xl"
          >
            “{content.mechanismCallout}”
          </blockquote>
        </div>
      </section>

      {/* Features — dark fold */}
      <section className="bg-lp-ink px-5 py-20 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal mx-auto max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl lg:text-[2.75rem]"
          >
            {content.featuresHeadline}
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {content.features.map((feature) => (
              <div key={feature.title} data-reveal className="lp-reveal flex gap-4">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lp-gold/15 text-lp-gold">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-wide">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-lp-cream px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <article
            data-reveal
            className="lp-reveal grid gap-8 rounded-2xl border border-lp-ink/5 bg-white p-8 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-12"
          >
            <div>
              <p className="font-seasons text-5xl leading-none text-lp-gold md:text-6xl">
                {content.resultMetric}
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-lp-muted">{content.resultLabel}</p>
            </div>
            <p className="text-base leading-relaxed text-lp-ink/80 md:text-lg">{content.resultStory}</p>
          </article>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {content.testimonials.map((item, i) => (
              <article
                key={item.name}
                data-reveal
                className="lp-reveal rounded-2xl bg-white px-6 py-7 shadow-sm"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex gap-1 text-lp-gold">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-lp-ink/80">“{item.text}”</p>
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-lp-muted">
                  {item.name}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Bonuses */}
      <section className="bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal mx-auto max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl"
          >
            {content.bonusesHeadline}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.bonuses.map((bonus, i) => (
              <article
                key={bonus.title}
                data-reveal
                className="lp-reveal rounded-2xl border border-lp-gold/25 bg-lp-cream/50 px-6 py-7"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lp-gold">
                  {bonus.badge}
                </p>
                <h3 className="mt-3 font-seasons text-2xl">{bonus.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lp-muted">{bonus.description}</p>
              </article>
            ))}
          </div>
          <div
            data-reveal
            className="lp-reveal mt-8 flex items-start gap-3 rounded-2xl border border-lp-gold/30 bg-lp-ink px-5 py-4 text-sm text-white/85 md:items-center"
          >
            <span className="mt-0.5 text-lp-gold md:mt-0">✱</span>
            <p>{content.urgencyBar}</p>
          </div>
        </div>
      </section>

      {/* Final CTA — foto visível com overlay controlado */}
      <section className="relative overflow-hidden px-5 py-24 md:px-8 md:py-28">
        <img
          src={content.finalCtaImage}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{ objectPosition: content.heroObjectPosition ?? "center 30%" }}
        />
        <div className="absolute inset-0 bg-lp-ink/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/70 via-lp-ink/40 to-lp-ink/30" />
        <div data-reveal className="lp-reveal relative mx-auto max-w-3xl text-center text-white">
          <h2 className="font-seasons text-3xl leading-tight md:text-5xl">{content.finalHeadline}</h2>
          <button
            type="button"
            onClick={scrollToForm}
            className="mt-10 rounded-full bg-lp-gold px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-lp-ink transition hover:bg-lp-gold-soft"
          >
            {content.finalCta}
          </button>
        </div>
      </section>

      <LpFooter />
    </div>
  );
}
