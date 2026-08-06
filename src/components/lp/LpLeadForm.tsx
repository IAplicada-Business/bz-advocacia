import { useState, type FormEvent } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackMetaLead } from "@/lib/metaPixel";
import type { LpFormField } from "./types";

type LpLeadFormProps = {
  slug: "saude" | "inventario" | "divorcio";
  title: string;
  subtitle: string;
  fields: LpFormField[];
  cta: string;
};

function readUtms() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const pick = (key: string) => params.get(key) ?? params.get(key.toUpperCase()) ?? undefined;
  return {
    source: pick("utm_source"),
    medium: pick("utm_medium"),
    campaign: pick("utm_campaign"),
    content: pick("utm_content"),
    term: pick("utm_term"),
  };
}

function readAdParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const keys = ["ad_id", "adset_id", "campaign_id", "fbclid", "ad_name", "adset_name", "campaign_name"];
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}


export function LpLeadForm({ slug, title, subtitle, fields, cta }: LpLeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("lp-lead-submit", {
        body: {
          slug,
          values,
          utm: readUtms(),
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });

      // supabase-js marca error em qualquer non-2xx; o body útil pode vir em data
      // ou em error.context (Response). Preferimos a mensagem da function.
      let payload = data as { error?: string; message?: string; ok?: boolean } | null;
      if (!payload && fnError && "context" in fnError) {
        try {
          const ctx = (fnError as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            payload = await ctx.json();
          }
        } catch {
          /* ignore parse */
        }
      }

      if (payload?.error === "invalid_contato" || payload?.error === "missing_fields") {
        setError(payload.message ?? "Preencha todos os campos obrigatórios.");
        return;
      }

      if (payload?.error || fnError) {
        console.error("[LpLeadForm] invoke error:", fnError, payload);
        setError("Não foi possível cadastrar seu caso. Tente novamente.");
        return;
      }

      trackMetaLead();
      setSubmitted(true);
    } catch (err) {
      console.error("[LpLeadForm] submit failed:", err);
      setError("Falha de conexão. Verifique a internet e tente de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[280px] w-full max-w-[480px] flex-col items-center justify-center rounded-[1.75rem] border border-white/60 bg-white/80 px-6 py-10 text-center shadow-lp backdrop-blur-xl sm:min-h-[380px] lg:mx-0 lg:max-w-none">
        <p className="font-seasons text-2xl text-lp-ink sm:text-3xl">Recebemos seu caso.</p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-lp-muted">
          Em breve nossa equipe entra em contato pelo WhatsApp para a análise gratuita.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-[480px] overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/80 shadow-lp backdrop-blur-xl lg:mx-0 lg:max-w-none"
    >
      <div className="border-b border-lp-ink/8 bg-white/55 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
        <h2 className="font-seasons text-[1.35rem] leading-tight text-lp-ink sm:text-[1.55rem] md:text-[1.65rem]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-lp-muted">{subtitle}</p>
      </div>

      <div className="space-y-3 px-4 py-3.5 sm:px-5 sm:py-4 md:space-y-3.5 md:px-6 md:py-5">
        {fields.map((field, index) => (
          <label key={field.id} className="block">
            <span className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-lp-ink/55 md:text-[11px]">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lp-gold/15 text-[10px] text-lp-gold">
                {index + 1}
              </span>
              {field.label}
            </span>
            {field.type === "select" ? (
              <select
                required={field.required}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className="w-full max-w-full rounded-2xl border border-lp-ink/10 bg-white/90 px-3.5 py-2.5 text-sm text-lp-ink outline-none transition focus:border-lp-gold"
              >
                <option value="">{field.placeholder ?? "Selecione"}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className="w-full max-w-full rounded-2xl border border-lp-ink/10 bg-white/90 px-3.5 py-2.5 text-sm text-lp-ink outline-none transition focus:border-lp-gold"
              />
            )}
          </label>
        ))}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-lp-ink px-4 py-3 text-center text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-white transition hover:bg-lp-ink/90 disabled:cursor-not-allowed disabled:opacity-70 sm:text-xs sm:tracking-[0.14em]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <span className="min-w-0 text-balance">{cta}</span>
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </>
          )}
        </button>
        <p className="text-balance text-center text-[10px] leading-snug text-lp-muted md:text-[11px]">
          Dados protegidos. Usamos só para retornar sobre o seu caso.
        </p>
      </div>
    </form>
  );
}
