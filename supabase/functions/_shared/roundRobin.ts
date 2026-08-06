// Round-robin de advogadas por área (task 2.2).
// Usa coluna real `areas` (não `especialidades`).

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export type AreaHandoff = "familia" | "inventario" | "saude";

export interface AdvogadaSdr {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  areas: string[];
  ativo: boolean;
}

export async function pickAdvogada(
  supabase: SupabaseClient,
  area: AreaHandoff,
): Promise<AdvogadaSdr | null> {
  const { data: advs, error } = await supabase
    .from("advogados_sdr")
    .select("id, nome, telefone, email, areas, ativo")
    .contains("areas", [area])
    .eq("ativo", true);

  if (error) {
    console.error("[pickAdvogada] erro:", error);
    return null;
  }
  if (!advs?.length) return null;

  const { data: counts } = await supabase.rpc("advogadas_lead_count_30d");
  const countMap = new Map<string, number>();
  for (const row of (counts ?? []) as { advogada_id: string; cnt: number }[]) {
    if (row?.advogada_id) countMap.set(row.advogada_id, row.cnt ?? 0);
  }

  const sorted = [...advs].sort(
    (a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0),
  );
  return sorted[0] as AdvogadaSdr;
}
