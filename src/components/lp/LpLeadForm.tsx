import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import type { LpFormField } from "./types";

type LpLeadFormProps = {
  title: string;
  subtitle: string;
  fields: LpFormField[];
  cta: string;
};

export function LpLeadForm({ title, subtitle, fields, cta }: LpLeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-lp-ink/8 bg-white px-6 py-10 text-center shadow-lp">
        <p className="font-seasons text-3xl text-lp-ink">Recebemos seu caso.</p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-lp-muted">
          Em breve nossa equipe entra em contato pelo WhatsApp para a análise gratuita.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-2xl border border-lp-ink/8 bg-white shadow-lp"
    >
      <div className="border-b border-lp-ink/8 bg-lp-cream/80 px-6 py-5">
        <h2 className="font-seasons text-2xl leading-tight text-lp-ink md:text-[1.7rem]">{title}</h2>
        <p className="mt-1.5 text-sm text-lp-muted">{subtitle}</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        {fields.map((field, index) => (
          <label key={field.id} className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-ink/55">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-lp-gold/15 text-[10px] text-lp-gold">
                {index + 1}
              </span>
              {field.label}
            </span>
            {field.type === "select" ? (
              <select
                required={field.required}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className="w-full rounded-xl border border-lp-ink/12 bg-lp-stone/50 px-3.5 py-2.5 text-sm text-lp-ink outline-none transition focus:border-lp-gold"
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
                className="w-full rounded-xl border border-lp-ink/12 bg-lp-stone/50 px-3.5 py-2.5 text-sm text-lp-ink outline-none transition focus:border-lp-gold"
              />
            )}
          </label>
        ))}

        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-lp-ink px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-lp-ink/90"
        >
          {cta}
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </button>
        <p className="text-center text-[11px] leading-relaxed text-lp-muted">
          Seus dados são protegidos. Usamos apenas para retornar sobre o seu caso.
        </p>
      </div>
    </form>
  );
}
