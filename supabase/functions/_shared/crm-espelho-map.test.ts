import { describe, expect, it } from "vitest";
import {
  mapStatusSdrToCrm,
  shouldPreserveCrmStage,
  stageFromStatusSdr,
} from "./crm-espelho-map";

describe("mapStatusSdrToCrm / stageFromStatusSdr", () => {
  it("mql_frio → perdido (não fechado/ganho)", () => {
    const mapped = mapStatusSdrToCrm("mql_frio");
    expect(mapped.estagio).toBe("perdido");
    expect(stageFromStatusSdr("mql_frio", mapped.estagio)).toBe("perdido");
  });

  it("desqualificado → stage desqualificado", () => {
    const mapped = mapStatusSdrToCrm("desqualificado");
    expect(mapped.estagio).toBe("perdido");
    expect(stageFromStatusSdr("desqualificado", mapped.estagio)).toBe(
      "desqualificado",
    );
  });

  it("perdido_recuperacao → perdido", () => {
    expect(stageFromStatusSdr("perdido_recuperacao", "fechado")).toBe("perdido");
  });

  it("em_atendimento_bot → mql (estagio novo)", () => {
    const mapped = mapStatusSdrToCrm("em_atendimento_bot");
    expect(mapped.estagio).toBe("novo");
    expect(stageFromStatusSdr("em_atendimento_bot", mapped.estagio)).toBe("mql");
  });
});

describe("shouldPreserveCrmStage", () => {
  it("preserva proposta/sal/contrato no remirror do bot", () => {
    expect(shouldPreserveCrmStage("proposta", "em_atendimento_bot")).toBe(true);
    expect(shouldPreserveCrmStage("sal", "novo")).toBe(true);
    expect(shouldPreserveCrmStage("contrato", "assumido_humano")).toBe(true);
  });

  it("não preserva mql/conectado (bot ainda pode avançar)", () => {
    expect(shouldPreserveCrmStage("mql", "em_atendimento_bot")).toBe(false);
    expect(shouldPreserveCrmStage("conectado", "em_atendimento_bot")).toBe(false);
  });

  it("terminal bot sobrescreve stage avançado", () => {
    expect(shouldPreserveCrmStage("proposta", "mql_frio")).toBe(false);
    expect(shouldPreserveCrmStage("sal", "desqualificado")).toBe(false);
    expect(shouldPreserveCrmStage("ganho", "perdido")).toBe(false);
  });
});
