import { describe, expect, it } from "vitest";
import { classificar } from "./classify-form";
import { validarMensagemDoBot } from "./campos_ja_respondidos";

describe("classificar form MQL", () => {
  it("partilha: consensual + imóveis+empresa + 30-60k = MQL", () => {
    const d = classificar({
      oferta: "partilha_protegida",
      respostas: {
        situacao: "consensual_negociacao",
        resolver: "partilha_bens",
        patrimonio: ["imoveis", "empresa"],
        renda: "30k_60k",
      },
      contato: { nome: "T", whatsapp: "5511999998888" },
    });
    expect(d.stage).toBe("mql");
  });

  it("partilha: só pensão = desqualificado", () => {
    const d = classificar({
      oferta: "partilha_protegida",
      respostas: {
        situacao: "casado_pensando",
        resolver: "apenas_pensao",
        patrimonio: ["imoveis"],
        renda: "30k_60k",
      },
      contato: { nome: "T", whatsapp: "5511999998888" },
    });
    expect(d.stage).toBe("desqualificado");
  });

  it("inventário: preventivo = continuidade", () => {
    const d = classificar({
      oferta: "inventario_otimizado",
      respostas: {
        fase: "preventivo",
        patrimonio_total: "1M_5M",
        composicao: ["imoveis"],
        conflito: "nao",
      },
      contato: { nome: "T", whatsapp: "5511999998888" },
    });
    expect(d.stage).toBe("continuidade");
  });

  it("saúde: risco de vida = MQL com PRIORIDADE_MAX", () => {
    const d = classificar({
      oferta: "cobertura_garantida",
      respostas: {
        situacao_plano: "negou_escrito",
        tipo_cobertura: "oncologico",
        urgencia: "risco_vida",
        valor_plano: "1500_3000",
      },
      contato: { nome: "T", whatsapp: "5511999998888" },
    });
    expect(d.stage).toBe("mql");
    expect(d.flags.includes("PRIORIDADE_MAX")).toBe(true);
  });

  it("saúde: plano popular = desqualificado", () => {
    const d = classificar({
      oferta: "cobertura_garantida",
      respostas: {
        situacao_plano: "negou_escrito",
        tipo_cobertura: "cirurgia",
        urgencia: "ate_30_dias",
        valor_plano: "ate_500",
      },
      contato: { nome: "T", whatsapp: "5511999998888" },
    });
    expect(d.stage).toBe("desqualificado");
  });
});

describe("validarMensagemDoBot", () => {
  it("bloqueia pergunta de renda em partilha", () => {
    const r = validarMensagemDoBot(
      "partilha_protegida",
      "Última pergunta: qual a renda familiar mensal aproximada?",
    );
    expect(r.ok).toBe(false);
  });

  it("permite M0 personalizado sem pergunta proibida", () => {
    const r = validarMensagemDoBot(
      "partilha_protegida",
      "Vi aqui que vocês estão em divórcio consensual em negociação. Posso te encaixar em 20 minutos?",
    );
    expect(r.ok).toBe(true);
  });
});
