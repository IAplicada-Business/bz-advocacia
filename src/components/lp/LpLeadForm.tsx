import { useState, type FormEvent } from "react";
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
    // Conexões e automações internas vêm depois — UI pronta.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-white px-6 py-10 text-center">
        <p className="font-seasons text-3xl text-lp-ink">Recebemos seu caso.</p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-lp-muted">
          Em breve nossa equipe entra em contato pelo WhatsApp para a análise gratuita.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white text-lp-ink shadow-lp">
      <div className="border-b border-lp-ink/10 bg-lp-ink px-6 py-5 text-white">
        <h2 className="font-seasons text-2xl leading-tight md:text-[1.65rem]">{title}</h2>
        <p className="mt-1.5 text-sm text-white/65">{subtitle}</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        {fields.map((field, index) => (
          <label key={field.id} className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-lp-muted">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-lp-cream text-[10px] text-lp-gold">
                {index + 1}
              </span>
              {field.label}
            </span>
            {field.type === "select" ? (
              <select
                required={field.required}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className="w-full rounded-sm border border-lp-ink/15 bg-lp-cream/40 px-3 py-2.5 text-sm outline-none transition focus:border-lp-gold"
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
                className="w-full rounded-sm border border-lp-ink/15 bg-lp-cream/40 px-3 py-2.5 text-sm outline-none transition focus:border-lp-gold"
              />
            )}
          </label>
        ))}

        <button
          type="submit"
          className="mt-2 w-full rounded-sm bg-lp-ink px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-lp-ink/90"
        >
          {cta}
        </button>
        <p className="text-center text-[11px] leading-relaxed text-lp-muted">
          Seus dados são protegidos. Usamos apenas para retornar sobre o seu caso.
        </p>
      </div>
    </form>
  );
}
