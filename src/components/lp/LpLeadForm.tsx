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
      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[1.75rem] border border-white/50 bg-white/70 px-6 py-10 text-center shadow-lp backdrop-blur-md">
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
      className="w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/72 shadow-lp backdrop-blur-md lg:max-w-none"
    >
      <div className="border-b border-lp-ink/8 bg-white/45 px-5 py-4 md:px-6">
        <h2 className="font-seasons text-[1.55rem] leading-tight text-lp-ink md:text-[1.65rem]">{title}</h2>
        <p className="mt-1 text-sm text-lp-muted">{subtitle}</p>
      </div>

      <div className="space-y-3 px-5 py-4 md:space-y-3.5 md:px-6 md:py-5">
        {fields.map((field, index) => (
          <label key={field.id} className="block">
            <span className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-lp-ink/55 md:text-[11px]">
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
                className="w-full rounded-2xl border border-lp-ink/10 bg-white/65 px-3.5 py-2.5 text-sm text-lp-ink outline-none transition focus:border-lp-gold"
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
                className="w-full rounded-2xl border border-lp-ink/10 bg-white/65 px-3.5 py-2.5 text-sm text-lp-ink outline-none transition focus:border-lp-gold"
              />
            )}
          </label>
        ))}

        <button
          type="submit"
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-lp-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-lp-ink/90"
        >
          {cta}
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </button>
        <p className="whitespace-nowrap text-center text-[10px] leading-none text-lp-muted md:text-[11px]">
          Dados protegidos. Usamos só para retornar sobre o seu caso.
        </p>
      </div>
    </form>
  );
}
