import { useEffect, useRef } from "react";
import { Check, Quote, Star } from "lucide-react";
import { LpHeader } from "./LpHeader";
import { LpFooter } from "./LpFooter";
import { LpLeadForm } from "./LpLeadForm";
import type { LpContent } from "./types";

type LandingPageProps = {
  content: LpContent;
};

export function LandingPage({ content }: LandingPageProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = content.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", content.metaDescription);
  }, [content]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="lp-theme min-h-screen bg-white font-sans text-lp-ink antialiased">
      <LpHeader onCtaClick={scrollToForm} />

      {/* Hero */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <img
          src={content.heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: content.heroObjectPosition ?? "center center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-lp-ink/92 via-lp-ink/78 to-lp-ink/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/50 via-transparent to-lp-ink/30" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-28 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-12 md:px-8 md:pb-20 md:pt-32">
          <div className="lp-fade-up text-white">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-lp-gold md:text-xs">
              {content.eyebrow}
            </p>
            <h1 className="mt-5 font-seasons text-[2.35rem] font-medium leading-[1.12] md:text-5xl lg:text-[3.35rem]">
              {content.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              {content.subheadline}
            </p>
            <ul className="mt-7 space-y-3">
              {content.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-white/85 md:text-[15px]">
                  <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lp-gold/20 text-lp-gold">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div ref={formRef} className="lp-fade-up lp-fade-up-delay">
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
          <p className="text-center text-[11px] uppercase tracking-[0.28em] text-lp-muted">
            {content.problemEyebrow}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
            {content.problemHeadline}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.quotes.map((quote) => (
              <article
                key={quote.text}
                className="rounded-sm border border-lp-ink/5 bg-white px-6 py-7 shadow-sm"
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
          <h2 className="mx-auto max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
            {content.mechanismHeadline}
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {content.mechanismSteps.map((step) => (
              <article key={step.number} className="rounded-sm border border-lp-ink/8 bg-lp-cream/40 p-6 md:p-7">
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
          <blockquote className="mt-10 rounded-sm bg-lp-gold/15 px-6 py-6 text-center font-seasons text-xl leading-snug text-lp-ink md:px-10 md:text-2xl">
            “{content.mechanismCallout}”
          </blockquote>
        </div>
      </section>

      {/* Features */}
      <section className="bg-lp-ink px-5 py-20 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mx-auto max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
            {content.featuresHeadline}
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {content.features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
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
          <article className="grid gap-8 rounded-sm bg-white p-8 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-12">
            <div>
              <p className="font-seasons text-5xl leading-none text-lp-gold md:text-6xl">
                {content.resultMetric}
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-lp-muted">{content.resultLabel}</p>
            </div>
            <p className="text-base leading-relaxed text-lp-ink/80 md:text-lg">{content.resultStory}</p>
          </article>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {content.testimonials.map((item) => (
              <article key={item.name} className="rounded-sm bg-white px-6 py-7 shadow-sm">
                <div className="flex gap-1 text-lp-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
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
          <h2 className="mx-auto max-w-3xl text-center font-seasons text-3xl leading-tight md:text-4xl">
            {content.bonusesHeadline}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.bonuses.map((bonus) => (
              <article
                key={bonus.title}
                className="rounded-sm border border-lp-gold/25 bg-lp-cream/50 px-6 py-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lp-gold">
                  {bonus.badge}
                </p>
                <h3 className="mt-3 font-seasons text-2xl">{bonus.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lp-muted">{bonus.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-sm border border-lp-gold/30 bg-lp-ink px-5 py-4 text-sm text-white/85 md:items-center">
            <span className="mt-0.5 text-lp-gold md:mt-0">✱</span>
            <p>{content.urgencyBar}</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-5 py-24 md:px-8 md:py-28">
        <img
          src={content.finalCtaImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-lp-ink/80" />
        <div className="relative mx-auto max-w-3xl text-center text-white">
          <h2 className="font-seasons text-3xl leading-tight md:text-5xl">{content.finalHeadline}</h2>
          <button
            type="button"
            onClick={scrollToForm}
            className="mt-10 rounded-sm bg-lp-gold px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-lp-ink transition hover:bg-lp-gold-soft"
          >
            {content.finalCta}
          </button>
        </div>
      </section>

      <LpFooter />
    </div>
  );
}
