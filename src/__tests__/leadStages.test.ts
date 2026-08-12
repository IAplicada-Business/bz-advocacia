import { describe, expect, it } from "vitest";
import { inferStageFromLegacy } from "@/lib/leadStages";

describe("inferStageFromLegacy", () => {
  it("mql_frio → perdido (nunca ganho)", () => {
    expect(inferStageFromLegacy({ status_sdr: "mql_frio", estagio: "fechado" })).toBe(
      "perdido",
    );
  });

  it("desqualificado status_sdr → desqualificado", () => {
    expect(inferStageFromLegacy({ status_sdr: "desqualificado" })).toBe(
      "desqualificado",
    );
  });

  it("stage explícito tem prioridade", () => {
    expect(
      inferStageFromLegacy({ stage: "proposta", status_sdr: "em_atendimento_bot" }),
    ).toBe("proposta");
  });
});
