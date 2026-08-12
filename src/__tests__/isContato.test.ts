import { describe, expect, it } from "vitest";
import { isContato } from "@/lib/isContato";
import type { Lead } from "@/types/leads";

function lead(partial: Partial<Lead>): Lead {
  return {
    id: "1",
    nome_completo: "Teste",
    telefone: "5511999999999",
    email: "",
    created_at: new Date().toISOString(),
    stage: "mql",
    estagio: "novo",
    status_cliente: "ativo", // DEFAULT do banco — NÃO significa cliente
    ...partial,
  } as Lead;
}

describe("isContato", () => {
  it("inclui MQL mesmo com status_cliente=ativo (default da coluna)", () => {
    expect(isContato(lead({ stage: "mql", status_cliente: "ativo" }))).toBe(true);
  });

  it("inclui proposta / perdido / desqualificado", () => {
    expect(isContato(lead({ stage: "proposta" }))).toBe(true);
    expect(isContato(lead({ stage: "perdido", estagio: "perdido" }))).toBe(true);
    expect(isContato(lead({ stage: "desqualificado" }))).toBe(true);
  });

  it("exclui ganho e status_sdr=cliente", () => {
    expect(isContato(lead({ stage: "ganho", estagio: "fechado" }))).toBe(false);
    expect(isContato(lead({ stage: "mql", status_sdr: "cliente" }))).toBe(false);
  });

  it("exclui importação e não-leads", () => {
    expect(isContato(lead({ como_conheceu: "importacao" }))).toBe(false);
    expect(isContato(lead({ tipo_contato: "fornecedor" }))).toBe(false);
  });

  it("exclui legado convertido (estagio fechado + status convertido)", () => {
    expect(
      isContato(
        lead({
          stage: "conectado",
          estagio: "fechado",
          status: "convertido",
        }),
      ),
    ).toBe(false);
  });
});
