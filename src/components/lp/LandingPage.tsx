import { useEffect, useRef } from "react";
import { Check, Quote, Star } from "lucide-react";
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

  return (
    <div className="lp-theme min-h-screen bg-lp-cream font-sans text-lp-ink antialiased">
      <LpHeader onCtaClick={scrollToForm} />

      {/* 1. HERO — foto atrás + copy esquerda + form direita (direcional original) */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <img
          src={content.heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.38]"
          style={{ objectPosition: content.heroObjectPosition ?? "70% 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-lp-cream via-lp-cream/90 to-lp-cream/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-cream/80 via-transparent to-lp-cream/40" />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col justify-center px-5 pb-14 pt-28 md:px-10 md:pb-16 md:pt-32 lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-12 xl:gap-16">
            <div data-reveal className="lp-reveal w-full max-w-[36rem] justify-self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-gold md:text-xs">
                {content.eyebrow}
              </p>
              <h1 className="mt-4 font-seasons text-[2.35rem] font-medium leading-[1.12] text-lp-ink md:text-5xl lg:text-[3.2rem]">
                {content.headline}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-lp-muted md:text-[1.05rem]">
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
            </div>

            <div
              ref={formRef}
              id="analise"
              data-reveal
              className="lp-reveal lp-reveal-delay w-full scroll-mt-28 lg:justify-self-end"
            >
              <LpLeadForm
                title={content.formTitle}
                subtitle={content.formSubtitle}
                fields={content.formFields}
                cta={content.formCta}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEMA — “O que a gente ouve todo dia” */}
      <section className="bg-lp-stone px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p
            data-reveal
            className="lp-reveal text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-gold"
          >
            {content.problemEyebrow}
          </p>
          <h2
            data-reveal
            className="lp-reveal mx-auto mt-3 max-w-3xl text-center font-seasons text-[1.85rem] leading-tight md:text-4xl lg:text-[2.65rem]"
          >
            {content.problemHeadline}
          </h2>
          <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
            {content.quotes.map((quote, i) => (
              <article
                key={quote.text}
                data-reveal
                className="lp-reveal rounded-2xl border border-lp-ink/5 bg-white px-5 py-6 shadow-sm md:px-6 md:py-7"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <Quote className="h-5 w-5 text-lp-gold md:h-6 md:w-6" strokeWidth={1.5} />
                <p className="mt-3 font-seasons text-lg leading-snug text-lp-ink/90 md:mt-4 md:text-xl">
                  “{quote.text}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MECANISMO — caminho comum × o que fazemos diferente */}
      <section className="bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal mx-auto max-w-3xl text-center font-seasons text-[1.85rem] leading-tight md:text-4xl lg:text-[2.65rem]"
          >
            {content.mechanismHeadline}
          </h2>
          <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
            {content.mechanismSteps.map((step, i) => (
              <article
                key={step.number}
                data-reveal
                className="lp-reveal flex flex-col rounded-2xl border border-lp-ink/8 bg-lp-cream/50 p-5 md:p-6"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-lp-gold/55 font-seasons text-lg text-lp-gold md:h-10 md:w-10 md:text-xl">
                  {step.number}
                </div>
                <h3 className="mt-4 font-seasons text-xl md:text-2xl">{step.title}</h3>
                <div className="mt-4 flex-1 space-y-3 text-sm leading-relaxed">
                  <p className="text-lp-muted">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-lp-ink/40">
                      Caminho comum
                    </span>
                    {step.conventional}
                  </p>
                  <p className="text-lp-ink/85">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-lp-gold">
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
            className="lp-reveal mt-8 rounded-2xl bg-lp-gold/15 px-5 py-5 text-center font-seasons text-lg leading-snug text-lp-ink md:mt-10 md:px-10 md:py-6 md:text-2xl"
          >
            “{content.mechanismCallout}”
          </blockquote>
        </div>
      </section>

      {/* 4. INCLUSO — dobra escura, grade 2×4 */}
      <section className="bg-lp-ink px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal mx-auto max-w-3xl text-center font-seasons text-[1.85rem] leading-tight md:text-4xl lg:text-[2.65rem]"
          >
            {content.featuresHeadline}
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-7 md:mt-12 md:grid-cols-2 md:gap-y-8">
            {content.features.map((feature) => (
              <div key={feature.title} data-reveal className="lp-reveal flex gap-3.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lp-gold/15 text-lp-gold">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-wide md:text-base">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/58">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROVA SOCIAL — métrica + depoimentos */}
      <section className="bg-lp-cream px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <article
            data-reveal
            className="lp-reveal grid gap-6 rounded-2xl border border-lp-ink/5 bg-white p-7 shadow-sm md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-10 md:p-10"
          >
            <div>
              <p className="font-seasons text-5xl leading-none text-lp-gold md:text-6xl">
                {content.resultMetric}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-lp-muted md:text-sm">
                {content.resultLabel}
              </p>
            </div>
            <p className="text-base leading-relaxed text-lp-ink/80 md:text-lg">{content.resultStory}</p>
          </article>

          <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-3 md:gap-5">
            {content.testimonials.map((item, i) => (
              <article
                key={item.name}
                data-reveal
                className="lp-reveal rounded-2xl bg-white px-5 py-6 shadow-sm md:px-6 md:py-7"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="flex gap-1 text-lp-gold">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-lp-ink/80">“{item.text}”</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-lp-muted">
                  {item.name}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BÔNUS + urgência */}
      <section className="bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2
            data-reveal
            className="lp-reveal mx-auto max-w-3xl text-center font-seasons text-[1.85rem] leading-tight md:text-4xl"
          >
            {content.bonusesHeadline}
          </h2>
          <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
            {content.bonuses.map((bonus, i) => (
              <article
                key={bonus.title}
                data-reveal
                className="lp-reveal rounded-2xl border border-lp-gold/25 bg-lp-cream/55 px-5 py-6 md:px-6 md:py-7"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lp-gold">
                  {bonus.badge}
                </p>
                <h3 className="mt-2.5 font-seasons text-xl md:text-2xl">{bonus.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-lp-muted">{bonus.description}</p>
              </article>
            ))}
          </div>
          <div
            data-reveal
            className="lp-reveal mt-6 flex items-start gap-3 rounded-2xl border border-lp-gold/30 bg-lp-ink px-5 py-4 text-sm text-white/85 md:mt-8 md:items-center"
          >
            <span className="mt-0.5 text-lp-gold md:mt-0">✱</span>
            <p>{content.urgencyBar}</p>
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL */}
      <section className="relative overflow-hidden px-5 py-20 md:px-8 md:py-24">
        <img
          src={content.finalCtaImage}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{ objectPosition: content.finalCtaObjectPosition ?? content.heroObjectPosition ?? "center 30%" }}
        />
        <div className="absolute inset-0 bg-lp-ink/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/75 via-lp-ink/45 to-lp-ink/35" />
        <div data-reveal className="lp-reveal relative mx-auto max-w-3xl text-center text-white">
          <h2 className="font-seasons text-3xl leading-tight md:text-5xl">{content.finalHeadline}</h2>
          <button
            type="button"
            onClick={scrollToForm}
            className="mt-8 rounded-full bg-lp-gold px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-lp-ink transition hover:bg-lp-gold-soft md:mt-10"
          >
            {content.finalCta}
          </button>
        </div>
      </section>

      <LpFooter />
    </div>
  );
}
