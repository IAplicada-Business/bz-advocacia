import type { ReactNode } from "react";

export type LpFormField = {
  id: string;
  label: string;
  type: "text" | "tel" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type LpQuote = {
  text: string;
};

export type LpMechanismStep = {
  number: string;
  title: string;
  conventional: string;
  different: string;
};

export type LpFeature = {
  title: string;
  description: string;
};

export type LpTestimonial = {
  name: string;
  text: string;
};

export type LpBonus = {
  badge: string;
  title: string;
  description: string;
};

export type LpContent = {
  slug: "saude" | "inventario" | "divorcio";
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: ReactNode;
  headlinePlain: string;
  subheadline: string;
  bullets: string[];
  heroImage: string;
  /** CSS object-position do hero (ex.: "center 22%") para não cortar rostos */
  heroObjectPosition?: string;
  /**
   * photo-panel: foto em frame à direita (padrão)
   * background: foto atrás com transparência + formulário à direita
   */
  heroStyle?: "photo-panel" | "background";
  finalCtaImage: string;
  formTitle: string;
  formSubtitle: string;
  formFields: LpFormField[];
  formCta: string;
  problemEyebrow: string;
  problemHeadline: ReactNode;
  quotes: LpQuote[];
  mechanismHeadline: ReactNode;
  mechanismSteps: LpMechanismStep[];
  mechanismCallout: string;
  featuresHeadline: ReactNode;
  features: LpFeature[];
  resultMetric: string;
  resultLabel: string;
  resultStory: string;
  testimonials: LpTestimonial[];
  bonusesHeadline: string;
  bonuses: LpBonus[];
  urgencyBar: string;
  finalHeadline: ReactNode;
  finalCta: string;
};
