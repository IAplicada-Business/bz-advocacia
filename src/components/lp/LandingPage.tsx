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
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToNext = () => {
    const folds = document.querySelectorAll<HTMLElement>("[data-fold]");
    folds[1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="lp-theme min-h-screen bg-lp-cream font-sans text-lp-ink antialiased">
      <LpHeader onCtaClick={scrollToForm} />

      {/* 1. HERO */}
      <section data-fold className="relative min-h-[100svh] overflow-hidden">
        <img
          data-lp-hero-img
          src={content.heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.5]"
          style={{ objectPosition: content.heroObjectPosition ?? "70% 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-lp-cream via-lp-cream/88 to-lp-cream/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-cream/70 via-transparent to-lp-cream/35" />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col justify-center px-5 pb-20 pt-28 md:px-10 md:pb-24 md:pt-32 lg:px-14">
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

      {/* 5. PROVA SOCIAL */}
      <section data-fold className="lp-fold bg-lp-cream px-5 md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-6xl">
          <article
            data-reveal
            className="lp-reveal lp-reveal-scale grid gap-10 rounded-2xl border border-lp-ink/5 bg-white p-9 shadow-sm md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-14 md:p-14 lg:p-16"
          >
            <div>
              <p className="font-seasons text-6xl leading-none text-lp-gold md:text-7xl lg:text-8xl">
                {content.resultMetric}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-lp-muted md:text-sm">
                {content.resultLabel}
              </p>
            </div>
            <p className="text-base leading-relaxed text-lp-ink/80 md:text-lg lg:text-xl">
              {content.resultStory}
            </p>
          </article>

          <div data-reveal className="lp-reveal mt-12 grid gap-7 md:mt-14 md:grid-cols-3 md:gap-8">
            {content.testimonials.map((item) => (
              <article
                key={item.name}
                data-stagger
                className="flex min-h-[250px] flex-col rounded-2xl bg-white px-7 py-9 shadow-sm md:min-h-[280px]"
              >
                <div className="flex gap-1 text-lp-gold">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-6 flex-1 text-sm leading-relaxed text-lp-ink/80 md:text-[15px]">
                  “{item.text}”
                </p>
                <p className="mt-7 text-xs font-medium uppercase tracking-[0.18em] text-lp-muted">
                  {item.name}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BÔNUS */}
      <section data-fold className="lp-fold bg-white px-5 md:px-8">
        <div className="lp-fold-inner mx-auto w-full max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal lp-reveal-scale mx-auto max-w-3xl text-center font-seasons text-[2.25rem] leading-tight md:text-4xl lg:text-[3rem]"
          >
            {content.bonusesHeadline}
          </h2>
          <div data-reveal className="lp-reveal mt-16 grid gap-7 md:mt-20 md:grid-cols-3 md:gap-8">
            {content.bonuses.map((bonus) => (
              <article
                key={bonus.title}
                data-stagger
                className="flex min-h-[250px] flex-col rounded-2xl border border-lp-gold/25 bg-lp-cream/55 px-7 py-9 md:min-h-[290px] md:px-8 md:py-10"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lp-gold">
                  {bonus.badge}
                </p>
                <h3 className="mt-5 font-seasons text-[1.75rem] md:text-[1.9rem]">{bonus.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-lp-muted md:text-[15px]">
                  {bonus.description}
                </p>
              </article>
            ))}
          </div>
          <div
            data-reveal
            className="lp-reveal mt-12 flex items-start gap-3 rounded-2xl border border-lp-gold/30 bg-lp-ink px-7 py-6 text-sm text-white/85 md:mt-14 md:items-center md:px-10 md:py-7 md:text-[15px]"
          >
            <span className="mt-0.5 text-lp-gold md:mt-0">✱</span>
            <p>{content.urgencyBar}</p>
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL */}
      <section data-fold className="relative min-h-[100svh] overflow-hidden px-5 py-32 md:px-8 md:py-40">
        <img
          src={content.finalCtaImage}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{
            objectPosition:
              content.finalCtaObjectPosition ?? content.heroObjectPosition ?? "center 30%",
          }}
        />
        <div className="absolute inset-0 bg-lp-ink/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/75 via-lp-ink/45 to-lp-ink/35" />
        <div
          data-reveal
          className="lp-reveal lp-reveal-scale relative mx-auto flex min-h-[55svh] max-w-3xl flex-col items-center justify-center text-center text-white"
        >
          <h2 className="font-seasons text-3xl leading-tight md:text-5xl lg:text-[3.5rem]">
            {content.finalHeadline}
          </h2>
          <button
            type="button"
            onClick={scrollToForm}
            className="mt-12 rounded-full bg-lp-gold px-9 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-lp-ink transition hover:bg-lp-gold-soft md:mt-14"
          >
            {content.finalCta}
          </button>
        </div>
      </section>

      <LpFooter />
    </div>
  );
}
