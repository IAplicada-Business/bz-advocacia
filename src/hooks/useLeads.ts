import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadsFilters } from "@/types/leads";
import { toast } from "@/lib/toast";
import {
  inferStageFromLegacy,
  stageToLegacyEstagio,
  stageToLegacyStatusSdr,
  type LeadStage,
} from "@/lib/leadStages";

type KanbanRow = Record<string, unknown> & {
  id: string;
  lead_geral_id?: string | null;
  data_ultima_atividade?: string | null;
  outro_como_conheceu?: string | null;
  stage?: string | null;
  estagio?: string | null;
  bot_status_sdr?: string | null;
  bot_fluxo_sdr?: string | null;
  bot_area_normalizada?: string | null;
  bot_score?: number | null;
  bot_etapa_qualificacao?: string | null;
  bot_bot_pausado?: boolean | null;
  bot_ultima_mensagem_em?: string | null;
  bot_origem_sdr?: string | null;
  bot_is_organic?: boolean | null;
  bot_platform?: string | null;
  bot_ad_id?: string | null;
  bot_campaign_id?: string | null;
  bot_tipo_contato?: string | null;
  bot_tipo_servico?: string | null;
  bot_urgencia?: string | null;
  bot_dados_capturados?: Record<string, unknown> | null;
};

function mapKanbanRowToLead(
  lead: KanbanRow,
  campanhaMap: Record<string, Lead["campanha_envio"]>,
): Lead {
  const dataUltimaAtividade = new Date(lead.data_ultima_atividade || Date.now());
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dataUltimaAtividade.getTime());
  const diasParado = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const camp = lead.lead_geral_id ? campanhaMap[lead.lead_geral_id] : null;

  const statusSdr = (lead.bot_status_sdr as string | null) ?? null;
  const stage = inferStageFromLegacy({
    stage: lead.stage as string | null,
    estagio: lead.estagio as string | null,
    status_sdr: statusSdr,
  });

  return {
    ...(lead as unknown as Lead),
    stage,
    dias_parado: diasParado,
    origem_descricao: lead.outro_como_conheceu || null,
    status_sdr: statusSdr,
    fluxo_sdr: (lead.bot_fluxo_sdr as string | null) ?? null,
    area_normalizada: (lead.bot_area_normalizada as string | null) ?? null,
    score: (lead.bot_score as number | null) ?? null,
    etapa_qualificacao: (lead.bot_etapa_qualificacao as string | null) ?? null,
    bot_pausado: (lead.bot_bot_pausado as boolean | null) ?? null,
    ultima_mensagem_em: (lead.bot_ultima_mensagem_em as string | null) ?? null,
    origem_sdr: (lead.bot_origem_sdr as string | null) ?? null,
    is_organic: (lead.bot_is_organic as boolean | null) ?? null,
    platform: (lead.bot_platform as string | null) ?? null,
    ad_id: (lead.bot_ad_id as string | null) ?? null,
    campaign_id: (lead.bot_campaign_id as string | null) ?? null,
    tipo_contato: (lead.bot_tipo_contato as string | null) ?? null,
    tipo_servico_bot: (lead.bot_tipo_servico as string | null) ?? null,
    urgencia: (lead.bot_urgencia as Lead["urgencia"]) ?? null,
    dados_capturados: (lead.bot_dados_capturados as Record<string, unknown> | null) ?? null,
    campanha_envio: camp ?? null,
  };
}

async function fetchCampanhas(leadGeralIds: string[]) {
  const campanhaMap: Record<string, Lead["campanha_envio"]> = {};
  if (leadGeralIds.length === 0) return campanhaMap;

  const { data: campData } = await supabase
    .from("campanhas_envio")
    .select("lead_geral_id, enviada_em, respondida_em, variacao_texto, status")
    .in("lead_geral_id", leadGeralIds)
    .order("created_at", { ascending: false });

  for (const c of campData || []) {
    if (c.lead_geral_id && !campanhaMap[c.lead_geral_id]) {
      campanhaMap[c.lead_geral_id] = {
        enviada_em: c.enviada_em,
        respondida_em: c.respondida_em,
        variacao_texto: c.variacao_texto,
        status: c.status,
      };
    }
  }
  return campanhaMap;
}

/**
 * Leads do kanban via vw_kanban_leads (exclui ganho > 30 dias e não-leads).
 * Fallback para contact_submissions se a view ainda não existir no ambiente.
 */
export function useLeads(filters: LeadsFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("vw_kanban_leads" as any)
        .select("*")
        .order("data_ultima_atividade", { ascending: false });

      if (filters.search) {
        query = query.or(
          `nome_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`,
        );
      }

      // Filtro legado por estagio (compat) — stage novo é agrupado no kanban
      if (filters.status.length > 0) {
        query = query.in("estagio", filters.status);
      }

      if (filters.origem.length > 0) {
        query = query.in("origem", filters.origem);
      }

      if (filters.tipoProcesso.length > 0) {
        query = query.in("tipo_processo", filters.tipoProcesso);
      }

      if (filters.dateRange.start) {
        query = query.gte("created_at", filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        query = query.lte("created_at", filters.dateRange.end.toISOString());
      }

      if (filters.responsavel) {
        query = query.eq("responsavel_id", filters.responsavel);
      }

      if (filters.statusCliente && filters.statusCliente.length > 0) {
        query = query.in("status_cliente", filters.statusCliente);
      }

      let { data, error } = await query;

      // Fallback se a view ainda não foi aplicada
      if (error && /vw_kanban_leads|relation .* does not exist/i.test(error.message)) {
        let fallback = supabase
          .from("contact_submissions")
          .select("*")
          .order("data_ultima_atividade", { ascending: false });
        if (filters.search) {
          fallback = fallback.or(
            `nome_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`,
          );
        }
        if (filters.status.length > 0) fallback = fallback.in("estagio", filters.status);
        if (filters.origem.length > 0) fallback = fallback.in("origem", filters.origem);
        if (filters.tipoProcesso.length > 0) {
          fallback = fallback.in("tipo_processo", filters.tipoProcesso);
        }
        if (filters.dateRange.start) {
          fallback = fallback.gte("created_at", filters.dateRange.start.toISOString());
        }
        if (filters.dateRange.end) {
          fallback = fallback.lte("created_at", filters.dateRange.end.toISOString());
        }
        if (filters.responsavel) fallback = fallback.eq("responsavel_id", filters.responsavel);
        if (filters.statusCliente?.length) {
          fallback = fallback.in("status_cliente", filters.statusCliente);
        }
        const fb = await fallback;
        data = (fb.data || []).map((row) => ({
          ...row,
          bot_status_sdr: null,
          bot_fluxo_sdr: null,
          bot_area_normalizada: null,
          bot_score: null,
          bot_etapa_qualificacao: null,
          bot_bot_pausado: null,
          bot_ultima_mensagem_em: null,
          bot_origem_sdr: null,
          bot_is_organic: null,
          bot_platform: null,
          bot_ad_id: null,
          bot_campaign_id: null,
          bot_tipo_contato: null,
          bot_tipo_servico: null,
          bot_urgencia: null,
          bot_dados_capturados: null,
        })) as unknown as typeof data;
        error = fb.error;
        if (error) throw error;

        const leadGeralIds = (data || [])
          .map((l) => (l as { lead_geral_id?: string | null }).lead_geral_id)
          .filter((id): id is string => !!id);

        const { data: botData } = await supabase
          .from("leads_geral")
          .select(
            "id, status_sdr, fluxo_sdr, area_normalizada, score, etapa_qualificacao, bot_pausado, ultima_mensagem_em, origem_sdr, is_organic, platform, ad_id, campaign_id, tipo_contato, tipo_servico, urgencia, dados_capturados",
          )
          .in("id", leadGeralIds);

        const botMap = Object.fromEntries((botData || []).map((b) => [b.id, b]));
        const campanhaMap = await fetchCampanhas(leadGeralIds);

        const mapped = (data || []).map((raw) => {
          const lead = raw as unknown as KanbanRow;
          const bot = lead.lead_geral_id ? botMap[lead.lead_geral_id] : null;
          return mapKanbanRowToLead(
            {
              ...lead,
              bot_status_sdr: bot?.status_sdr ?? null,
              bot_fluxo_sdr: bot?.fluxo_sdr ?? null,
              bot_area_normalizada: bot?.area_normalizada ?? null,
              bot_score: bot?.score ?? null,
              bot_etapa_qualificacao: bot?.etapa_qualificacao ?? null,
              bot_bot_pausado: bot?.bot_pausado ?? null,
              bot_ultima_mensagem_em: bot?.ultima_mensagem_em ?? null,
              bot_origem_sdr: bot?.origem_sdr ?? null,
              bot_is_organic: bot?.is_organic ?? null,
              bot_platform: bot?.platform ?? null,
              bot_ad_id: bot?.ad_id ?? null,
              bot_campaign_id: bot?.campaign_id ?? null,
              bot_tipo_contato: bot?.tipo_contato ?? null,
              bot_tipo_servico: bot?.tipo_servico ?? null,
              bot_urgencia: bot?.urgencia ?? null,
              bot_dados_capturados: (bot?.dados_capturados as Record<string, unknown>) ?? null,
            },
            campanhaMap,
          );
        });

        return applyDiasParadoFilter(mapped, filters);
      }

      if (error) throw error;

      const leadGeralIds = (data || [])
        .map((l) => (l as { lead_geral_id?: string | null }).lead_geral_id)
        .filter((id): id is string => !!id);
      const campanhaMap = await fetchCampanhas(leadGeralIds);

      const mapped = (data || []).map((raw) =>
        mapKanbanRowToLead(raw as unknown as KanbanRow, campanhaMap),
      );

      return applyDiasParadoFilter(mapped, filters);
    },
  });
}

function applyDiasParadoFilter(leads: Lead[], filters: LeadsFilters): Lead[] {
  if (filters.diasParado.max !== null) {
    return leads.filter(
      (lead) =>
        lead.dias_parado! >= filters.diasParado.min &&
        lead.dias_parado! <= filters.diasParado.max!,
    );
  }
  if (filters.diasParado.min > 0) {
    return leads.filter((lead) => lead.dias_parado! >= filters.diasParado.min);
  }
  return leads;
}

export function useUpdateLeadStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      stage,
      estagio,
      leadGeralId,
      overrideMissing,
    }: {
      id: string;
      stage?: LeadStage;
      /** @deprecated Prefer stage */
      estagio?: string;
      leadGeralId?: string | null;
      overrideMissing?: { field: string; label: string }[];
    }) => {
      const resolvedStage: LeadStage | null =
        stage ??
        (estagio
          ? inferStageFromLegacy({ estagio, stage: null, status_sdr: null })
          : null);

      const legacyEstagio =
        estagio ?? (resolvedStage ? stageToLegacyEstagio(resolvedStage) : undefined);

      const patch: Record<string, unknown> = {
        data_ultima_atividade: new Date().toISOString(),
      };
      if (resolvedStage) patch.stage = resolvedStage;
      if (legacyEstagio) patch.estagio = legacyEstagio;
      if (resolvedStage === "ganho") {
        patch.status_cliente = "ativo";
      }

      const { data, error } = await supabase
        .from("contact_submissions")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (leadGeralId && resolvedStage) {
        const statusSdr = stageToLegacyStatusSdr(resolvedStage);
        const lgPatch: Record<string, unknown> = { stage: resolvedStage };
        if (statusSdr) lgPatch.status_sdr = statusSdr;
        const { error: lgErr } = await supabase
          .from("leads_geral")
          .update(lgPatch)
          .eq("id", leadGeralId);
        if (lgErr) throw lgErr;
      }

      if (overrideMissing && overrideMissing.length > 0 && resolvedStage) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("stage_transitions_override" as any).insert({
          lead_id: id,
          lead_source: "contact_submissions",
          to_stage: resolvedStage,
          missing_fields: overrideMissing,
          user_id: user?.id ?? null,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-ativos"] });
      toast({
        title: "Lead atualizado",
        description: "O estágio do lead foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: Partial<Lead>) => {
      const { dias_parado, campanha_envio, ...dataToInsert } = leadData;
      const { data, error } = await supabase
        .from("contact_submissions")
        .insert({
          ...dataToInsert,
          stage: leadData.stage || "mql",
          estagio: leadData.estagio || "novo",
          origem: leadData.origem || "site",
          prioridade: leadData.prioridade || "media",
          data_ultima_atividade: new Date().toISOString(),
          lgpd_consent: true,
        } as never)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("atividades").insert({
        tipo: "lead_criado",
        descricao: "Lead criado manualmente",
        entidade_tipo: "lead",
        entidade_id: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({
        title: "Lead criado",
        description: "O lead foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { dias_parado, campanha_envio, ...dataToUpdate } = updates;
      const { data, error } = await supabase
        .from("contact_submissions")
        .update(dataToUpdate as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("atividades").insert({
        tipo: "editado",
        descricao: "Informações do lead foram atualizadas",
        entidade_tipo: "lead",
        entidade_id: id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", leadId);

      if (error) throw error;

      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });

      toast({
        title: "Lead excluído",
        description: "O lead foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkCreateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leads: Partial<Lead>[]) => {
      const leadsToInsert = leads.map((lead) => ({
        nome_completo: lead.nome_completo || "",
        email: lead.email || "",
        telefone: lead.telefone || "",
        tipo_processo: lead.tipo_processo || "",
        origem: lead.origem || "site",
        stage: lead.stage || "mql",
        estagio: lead.estagio || "novo",
        prioridade: lead.prioridade || "media",
        mensagem: lead.mensagem || "",
        como_conheceu: lead.origem || "site",
        data_ultima_atividade: new Date().toISOString(),
        lgpd_consent: true,
      }));

      const { data, error } = await supabase
        .from("contact_submissions")
        .insert(leadsToInsert as never)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      console.error("Bulk create error:", error);
      toast({
        title: "Erro ao importar leads",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
