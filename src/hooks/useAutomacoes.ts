import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, MessageCircle, LucideIcon } from "lucide-react";
import { toast } from "@/lib/toast";

export interface ApiIntegration {
  id: string;
  nome: string;
  descricao: string;
  status: "ativo" | "pendente" | "erro" | "inativo";
  totalConsultas: number;
  consultasSucesso: number;
  consultasErro: number;
  ultimaAtividade: string | null;
  edgeFunctionPath: string | null;
  endpoint: string | null;
  icone: LucideIcon;
  configurado: boolean;
  podeEditar: boolean;
  podeExcluir: boolean;
  tabelaOrigem: "meta_connections" | "whatsapp_config" | "consultas_config" | null;
  detalhes: {
    provedor?: string;
    ambiente?: string;
    creditos?: number;
    accountId?: string;
    accountName?: string;
    ultimaSincronizacao?: string;
    telefone?: string;
    phoneNumberId?: string;
    webhookUrl?: string;
    apiKeyMasked?: string;
    rateLimit?: string;
    leadsImportados?: number;
    leadsUltimas24h?: number;
  };
}

export function useAutomacoes() {
  return useQuery({
    queryKey: ["automacoes"],
    queryFn: async () => {
      const [metaConnections, whatsappConfig] = await Promise.all([
        supabase.from("meta_connections").select("*").maybeSingle(),
        supabase.from("whatsapp_config").select("*").maybeSingle(),
      ]);

      const meta = metaConnections.data;
      const metaConectado = Boolean(
        meta?.access_token || meta?.account_id || meta?.status === "ativo",
      );

      const wa = whatsappConfig.data;
      const waConectado = Boolean(
        wa &&
          (wa.active === true ||
            wa.phone_number ||
            wa.phone_number_id ||
            (wa.credentials && Object.keys(wa.credentials as object).length > 0)),
      );

      const integrations: ApiIntegration[] = [
        {
          id: "meta-ads",
          nome: "Marketing (Facebook / Meta)",
          descricao: "Gestão de campanhas de marketing digital",
          status: metaConectado ? "ativo" : "inativo",
          totalConsultas: 0,
          consultasSucesso: 0,
          consultasErro: 0,
          ultimaAtividade: meta?.ultima_sincronizacao || meta?.conectado_em || null,
          edgeFunctionPath: "meta-metrics",
          endpoint: "https://graph.facebook.com",
          icone: Facebook,
          configurado: metaConectado,
          podeEditar: !!meta,
          podeExcluir: !!meta,
          tabelaOrigem: "meta_connections",
          detalhes: {
            accountId: meta?.account_id,
            accountName: meta?.account_name,
            ultimaSincronizacao: meta?.ultima_sincronizacao ?? undefined,
          },
        },
        {
          id: "whatsapp",
          nome: "WhatsApp Business",
          descricao: "Envio de mensagens e notificações via WhatsApp",
          status: waConectado ? "ativo" : "inativo",
          totalConsultas: 0,
          consultasSucesso: 0,
          consultasErro: 0,
          ultimaAtividade: wa?.updated_at || null,
          edgeFunctionPath: "whatsapp-send",
          endpoint: null,
          icone: MessageCircle,
          configurado: waConectado,
          podeEditar: !!wa,
          podeExcluir: !!wa,
          tabelaOrigem: "whatsapp_config",
          detalhes: {
            provedor: wa?.provider,
            telefone: wa?.phone_number,
            phoneNumberId: wa?.phone_number_id ?? undefined,
          },
        },
      ];

      return integrations;
    },
  });
}

export function useDeleteAutomacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tabelaOrigem }: { id: string; tabelaOrigem: string }) => {
      let error = null;

      if (tabelaOrigem === "meta_connections") {
        const result = await supabase.from("meta_connections").delete().neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "whatsapp_config") {
        const result = await supabase.from("whatsapp_config").delete().neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "consultas_config") {
        const result = await supabase.from("consultas_config").delete().neq("id", "");
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automacoes"] });
      toast({
        title: "Integração excluída",
        description: "A integração foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAutomacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tabelaOrigem,
      data,
    }: {
      tabelaOrigem: string;
      data: Record<string, unknown>;
    }) => {
      let error = null;

      if (tabelaOrigem === "meta_connections") {
        const result = await supabase
          .from("meta_connections")
          .update({ ...data, updated_at: new Date().toISOString() })
          .neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "whatsapp_config") {
        const result = await supabase
          .from("whatsapp_config")
          .update({ ...data, updated_at: new Date().toISOString() })
          .neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "consultas_config") {
        const result = await supabase
          .from("consultas_config")
          .update({ ...data, updated_at: new Date().toISOString() })
          .neq("id", "");
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automacoes"] });
      toast({
        title: "Integração atualizada",
        description: "As configurações foram salvas com sucesso.",
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
