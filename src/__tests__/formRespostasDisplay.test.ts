import { describe, expect, it } from "vitest";
import {
  extractFormRespostas,
  formInsightChip,
  ofertaLabel,
} from "@/lib/formRespostasDisplay";

describe("formRespostasDisplay", () => {
  it("lê sdr_contexto.respostas com labels legíveis", () => {
    const items = extractFormRespostas({
      sdrContexto: {
        oferta: "partilha_protegida",
        respostas: {
          situacao: "litigioso_andamento",
          resolver: "partilha_bens",
          renda: "30k_60k",
        },
        melhor_horario: "manhã",
      },
    });
    expect(items.find((i) => i.key === "resolver")?.value).toBe("Partilha de bens");
    expect(items.find((i) => i.key === "renda")?.value).toContain("30.000");
    expect(items.find((i) => i.key === "melhor_horario")?.value).toBe("manhã");
  });

  it("fallback para dados_capturados do public-form-submit", () => {
    const items = extractFormRespostas({
      dadosCapturados: {
        source: "public_form_submit",
        slug: "divorcio",
        situacao: "casado_pensando",
        resolver: "partilha_bens",
      },
    });
    expect(items.some((i) => i.key === "situacao")).toBe(true);
    expect(items.every((i) => i.key !== "source")).toBe(true);
  });

  it("chip resume 1–2 campos chave", () => {
    const chip = formInsightChip({
      sdrContexto: {
        respostas: {
          resolver: "partilha_bens",
          renda: "acima_60k",
        },
      },
    });
    expect(chip).toContain("Partilha de bens");
  });

  it("ofertaLabel", () => {
    expect(ofertaLabel("cobertura_garantida")).toMatch(/saúde/i);
  });
});
