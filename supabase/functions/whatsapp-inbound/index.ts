// Edge Function: whatsapp-inbound
// Recebe webhook da Z-API quando o lead manda mensagem.
// Schema real V4: leads_geral + *_sdr. verify_jwt = false (Z-API não passa JWT).

import {
  buscarLeadPorTelefone,
  criarLeadWhatsApp,
  getSupabaseAdmin,
  historicoMensagens,
  nomePrimeiro,
  registrarEvento,
  registrarMensagem,
  telefoneDoLead,
  buscarAdvogadoPorArea,
  fluxoFromArea,
  espelharContactSubmission,
  Lead,
} from "../_shared/db.ts";
import { normalizarTelefone, zapiSendText } from "../_shared/zapi.ts";
import { claudeJson, type ClaudeJsonResult } from "../_shared/claude.ts";
import {
  AREA_LABEL,
  AREA_NUM_TO_KEY,
  extrairNumero,
  mensagemForaEscopo,
  mensagemHandoffAgendamento,
  mensagemM0Organico,
  mensagemM0Recuperacao,
  mensagemReabertura,
  PERGUNTA_TEXTO_POR_CODIGO,
  SYSTEM_PROMPT_CLASSIFICADOR,
  templatePorEtapa,
} from "../_shared/prompts.ts";
import { pickAdvogada, type AreaHandoff } from "../_shared/roundRobin.ts";
import {
  CHAVE_POR_ETAPA,
  IDS_DESQUALIFICA,
  IDS_HANDOFF,
  PERGUNTA_TEXTO_V1,
  SEQUENCIA,
  SYSTEM_PROMPT_ROTEIRO_V1,
  aplicarRegrasV1,
  cadencia,
  etapasPendentes,
  respostasFormParaDadosBot,
  templateV1,
  type ClassificacaoV1,
} from "../_shared/roteiro-v1.ts";
import {
  MSG_PENSAO_GUARDA,
  avaliarFamilia,
  avaliarInventario,
  avaliarSaude,
  extrairLetraOpcao,
  mergeRespostaPorEtapa,
  type RespostasFamilia,
  type RespostasInventario,
  type RespostasSaude,
} from "../_shared/qualificacao.ts";
import {
  ETAPA_ROTEIRO_POR_CAMPO,
  validarMensagemDoBot,
} from "../_shared/campos_ja_respondidos.ts";
import {
  areaFromOferta,
  montarM0Personalizado,
  systemPromptComContexto,
  type SdrContexto,
} from "../_shared/form-m0.ts";
import type { Oferta, StageDecisao } from "../_shared/classify-form.ts";

interface ZapiInboundPayload {
  phone?: string;
  fromMe?: boolean;
  isStatusReply?: boolean;
  isGroup?: boolean;
  text?: { message?: string };
  message?: string;
  [k: string]: unknown;
}

interface ClaudeResponse {
  area:
    | "familia"
    | "inventario"
    | "saude"
    | "fora_escopo"
    | "pensao_guarda_only"
    | "nao_identificada"
    | string;
  etapa_proxima:
    | "M0"
    | "M1"
    | "M2"
    | "M2_valor"
    | "M3"
    | "finalizado"
    | string;
  dados_capturados: Record<string, unknown>;
  score: number;
  motivo: string;
  proxima_mensagem: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: ZapiInboundPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Autenticação via query string ?t=SECRET (Z-API não suporta header custom).
  // Obrigatório: sem ?t= ou com ?t= errado → 401.
  {
    const url = new URL(req.url);
    const tokenRecebido = url.searchParams.get("t");
    const tokenEsperado = Deno.env.get("SDR_INBOUND_SECRET");
    if (tokenEsperado) {
      if (!tokenRecebido || tokenRecebido !== tokenEsperado) {
        await supabase.from("eventos_sdr").insert({
          tipo: tokenRecebido
            ? "webhook_secret_invalido_rejeitado"
            : "webhook_sem_secret_rejeitado",
          payload: { path: url.pathname, ua: req.headers.get("user-agent") },
        });
        return new Response("forbidden", { status: 401 });
      }
    }
  }




  // Idempotência por messageId — evita reprocessar retries da Z-API
  const messageId = (payload as any).messageId as string | undefined;
  if (messageId) {
    const { error: lockErr } = await supabase
      .from("mensagens_inbound_lock")
      .insert({ message_id: messageId });
    if (lockErr && (lockErr.code === "23505" || lockErr.message?.includes("duplicate"))) {
      await registrarEvento(supabase, null, "webhook_duplicado_ignorado", { messageId });
      return new Response(JSON.stringify({ ignored: "duplicate_messageId" }), { status: 200 });
    }
  }

  // Debug verboso (raw_payload_debug + webhook_recebido) só com flag explícita.
  // Default: desligado, pra não inflar eventos_sdr.
  if (Deno.env.get("DEBUG_RAW_PAYLOAD") === "true") {
    await registrarEvento(supabase, null, "raw_payload_debug", payload);
    await registrarEvento(supabase, null, "webhook_recebido", {
      phone: payload.phone,
      fromMe: payload.fromMe,
      isStatusReply: payload.isStatusReply,
      isGroup: payload.isGroup,
      has_text: !!(payload.text?.message ?? payload.message),
      raw_keys: Object.keys(payload ?? {}),
    });
  }

  // ============================================================
  // IDs anônimos do WhatsApp (LID / broadcast / newsletter) não são
  // telefones reais. Sem essa guarda, normalizarTelefone() gera leads
  // fantasma de 15-17 dígitos (ex.: 128007339511859@lid → 55128007339511859).
  // ============================================================
  {
    const phoneRaw = (payload.phone ?? "").toString();
    const participantPhone = ((payload as any).participantPhone ?? "").toString();
    const participantLid = ((payload as any).participantLid ?? "").toString();

    const phoneEhAnonimo =
      phoneRaw.includes("@lid") ||
      phoneRaw.includes("@broadcast") ||
      phoneRaw.includes("@newsletter");

    if (phoneEhAnonimo) {
      const ppDigits = participantPhone.replace(/\D/g, "");
      // Aperta: só aceita se for telefone BR plausível (DDI 55 + DDD + número).
      const candidato = /^55\d{10,11}$/.test(ppDigits) ? ppDigits : null;

      if (!candidato) {
        await registrarEvento(supabase, null, "webhook_anonimo_ignorado", {
          phone: phoneRaw,
          chatLid: (payload as any).chatLid ?? null,
          participantLid: participantLid || null,
          participantPhone: participantPhone || null,
          participantPhone_digits: ppDigits || null,
          senderName: (payload as any).senderName ?? null,
          fromMe: !!payload.fromMe,
        });
        return new Response(
          JSON.stringify({ ignored: "anonimo_ou_broadcast" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      (payload as any).phone = candidato;
      await registrarEvento(supabase, null, "webhook_anonimo_recuperado_via_participant", {
        phone_original: phoneRaw,
        phone_recuperado: candidato,
      });
    }
  }


  // Status reply / grupo: sempre ignora
  if (payload.isStatusReply) {
    return new Response(JSON.stringify({ ignored: "status_reply" }), { status: 200 });
  }
  if (payload.isGroup) {
    return new Response(JSON.stringify({ ignored: "grupo" }), { status: 200 });
  }

  const texto = (payload.text?.message ?? payload.message ?? "").toString();
  if (!payload.phone) {
    return new Response(JSON.stringify({ ignored: "sem_phone" }), { status: 200 });
  }
  const telefone = normalizarTelefone(payload.phone);

  // ============================================================
  // WHITELIST DE TESTE — sobrepõe TODOS os guards (camadas 1-4,
  // bot_pausado, status, humano ativo). Uso exclusivo de testes.
  // ============================================================
  let modoTeste = false;
  {
    const tel8 = telefone.replace(/\D/g, "").slice(-8);
    const { data: whitelist } = await supabase
      .from("whitelist_teste_bot")
      .select("telefone_8")
      .eq("telefone_8", tel8)
      .limit(1);
    if (whitelist?.length) {
      modoTeste = true;
      await registrarEvento(supabase, null, "bot_whitelist_teste_ignorou_guards", {
        telefone_8: tel8,
        telefone,
      });
    }
  }

  // ============================================================
  // GUARD: números bloqueados (advogados, equipe, parceiros).
  // Bot fica fora — não cria lead, não responde, não classifica.
  // ============================================================
  if (!modoTeste) {
    // Compara pelos últimos 8 dígitos — a tabela tem formatos mistos
    // (com/sem DDI, e o backfill v2 grava só os 8 finais).
    const ult8Bloq = telefone.replace(/\D/g, "").slice(-8);
    const { data: bloqueado } = await supabase
      .from("numeros_bloqueados_bot")
      .select("telefone, nome, motivo")
      .like("telefone", `%${ult8Bloq}`)
      .limit(1)
      .maybeSingle();
    if (bloqueado) {
      await registrarEvento(supabase, null, "numero_bloqueado_ignorado", {
        telefone,
        nome: (bloqueado as any).nome ?? null,
        motivo: (bloqueado as any).motivo ?? null,
        fromMe: !!payload.fromMe,
      });
      return new Response(
        JSON.stringify({ ignored: "numero_bloqueado" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }



  // ============================================================
  // GUARD INTELIGENTE: telefone já no CRM (contact_submissions) sem
  // vínculo com bot (lead_geral_id IS NULL)
  //   - Atendimento manual ATIVO  → bot fica fora + entra no BACKLOG TRIAGEM
  //   - 'novo' antigo / 'perdido' → bot adota (segue o fluxo;
  //     espelhamento linka o registro existente em vez de duplicar)
  // ============================================================
  if (!modoTeste) {
    const ultimos8 = telefone.slice(-8);
    const { data: csExisting } = await supabase
      .from("contact_submissions")
      .select("id, estagio, status, responsavel_id, ultimo_contato_em, created_at, nome_completo")
      .like("telefone_digits", `%${ultimos8}`)
      .is("lead_geral_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (csExisting) {
      const cs: any = csExisting;
      const ESTAGIOS_ATIVOS = ["contato_inicial", "em_analise", "proposta_enviada", "fechado"];
      const estagioAtivo = ESTAGIOS_ATIVOS.includes(cs.estagio);
      const temResponsavel = !!cs.responsavel_id;

      if (estagioAtivo || temResponsavel) {
        // Backlog triagem (motivo=contato_em_andamento)
        try {
          await supabase.from("backlog_triagem").insert({
            motivo: "contato_em_andamento",
            telefone,
            telefone_digits: telefone.replace(/\D/g, ""),
            nome_capturado: cs.nome_completo ?? null,
            msg_recebida: texto,
            contact_submission_id: cs.id,
          });
        } catch (_e) { /* ignore dup */ }

        await registrarEvento(supabase, null, "bot_silenciado_contato_em_andamento", {
          telefone,
          contact_submission_id: cs.id,
          estagio: cs.estagio,
          tem_responsavel: temResponsavel,
          fromMe: !!payload.fromMe,
        });
        return new Response(
          JSON.stringify({ ignored: "lead_no_crm", backlog: "contato_em_andamento" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // 'novo' antigo ou 'perdido' → bot adota; segue o fluxo abaixo.
      await registrarEvento(supabase, null, "lead_no_crm_adotado_pelo_bot", {
        telefone,
        contact_submission_id: cs.id,
        estagio_anterior: cs.estagio,
        ultimo_contato_em: cs.ultimo_contato_em,
      });
    }
  }


  // ============================================================
  // fromMe=true → humano da B&Z respondeu pelo celular.
  // payload.phone = telefone do LEAD (a outra parte da conversa).
  // Pausa o bot e marca a conversa como assumida por humano.
  // ============================================================
  if (payload.fromMe) {
    if (!texto.trim()) {
      return new Response(JSON.stringify({ ignored: "fromMe_sem_texto" }), { status: 200 });
    }

    // ============================================================
    // ECHO GUARD: Z-API ecoa as próprias mensagens enviadas via API
    // de volta como webhook com fromMe=true (e às vezes fromApi=false).
    // Sem isso, o bot pausa a si mesmo após cada M0/M1 enviada.
    // ============================================================
    {
      const fromApi = (payload as any).fromApi === true;
      let isEcho = fromApi;

      if (!isEcho) {
        // Busca lead por telefone e checa se o texto bate com mensagem
        // recente (origem bot/humano) registrada nos últimos 90s.
        const leadEcho = await buscarLeadPorTelefone(supabase, telefone);
        if (leadEcho) {
          const desde = new Date(Date.now() - 90_000).toISOString();
          const { data: matchEcho } = await supabase
            .from("mensagens_sdr")
            .select("id, origem, enviada_em")
            .eq("lead_id", leadEcho.id)
            .in("origem", ["bot", "humano"])
            .eq("conteudo", texto)
            .gte("enviada_em", desde)
            .limit(1)
            .maybeSingle();
          if (matchEcho) isEcho = true;
        }
      }

      if (isEcho) {
        await registrarEvento(supabase, null, "webhook_echo_ignorado", {
          telefone,
          fromApi,
          messageId: (payload as any).messageId ?? null,
          preview: texto.slice(0, 80),
        });
        return new Response(
          JSON.stringify({ ignored: "echo_proprio_bot" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }


    // Resolve Time B&Z (advogado humano fallback)
    let timeBzId: string | null = null;
    {
      const { data: tbz } = await supabase
        .from("advogados_sdr")
        .select("id")
        .eq("ativo", true)
        .ilike("nome", "%Time B&Z%")
        .limit(1)
        .maybeSingle();
      if (tbz) {
        timeBzId = (tbz as any).id;
      } else {
        const { data: any1 } = await supabase
          .from("advogados_sdr")
          .select("id")
          .eq("ativo", true)
          .limit(1)
          .maybeSingle();
        timeBzId = (any1 as any)?.id ?? null;
      }
    }

    let leadFromMe = await buscarLeadPorTelefone(supabase, telefone);
    if (!leadFromMe) {
      // Telefone desconhecido + humano da B&Z escrevendo → vai pro BACKLOG
      // (aprovação manual no painel antes de virar lead_geral).
      const p = payload as any;
      const senderName: string | undefined = p.chatName ?? p.notifyName ?? p.senderName;

      // Evita duplicar entradas pendentes pro mesmo telefone
      const { data: existente } = await supabase
        .from("leads_backlog")
        .select("id")
        .eq("telefone", telefone)
        .eq("status", "pendente")
        .limit(1)
        .maybeSingle();

      if (!existente) {
        await supabase.from("leads_backlog").insert({
          telefone,
          telefone_raw: (payload as any).phone ?? telefone,
          nome: senderName ?? null,
          primeira_mensagem: texto,
          origem: "humano_iniciou",
          payload: payload as any,
          status: "pendente",
        });
      }

      await registrarEvento(supabase, null, "humano_iniciou_para_telefone_desconhecido_backlog", {
        telefone,
        backlog_existente: !!existente,
      });

      return new Response(
        JSON.stringify({ ok: true, acao: "enviado_para_backlog" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("leads_geral")
      .update({
        bot_pausado: true,
        status_sdr: "assumido_humano",
        humano_responsavel: timeBzId,
        assumido_em: new Date().toISOString(),
      })
      .eq("id", leadFromMe.id);

    await registrarMensagem(supabase, leadFromMe.id, "humano", texto, {
      telefone,
      via: "celular_fromMe",
    });
    await registrarEvento(supabase, leadFromMe.id, "humano_assumiu_via_celular", {
      telefone,
      time_bz_id: timeBzId,
    });

    // Espelha estado "assumido_humano" no kanban
    await espelharContactSubmission(
      supabase,
      { ...leadFromMe, status_sdr: "assumido_humano" },
      { platform: "whatsapp_organico", mensagem: "Time B&Z assumiu via celular" },
    );

    return new Response(
      JSON.stringify({ ok: true, acao: "humano_assumiu_via_celular", lead_id: leadFromMe.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // fromMe=false a partir daqui
  if (!texto.trim()) {
    return new Response(JSON.stringify({ ignored: "sem_texto" }), { status: 200 });
  }

  // Localiza lead — se não existir, cria automaticamente
  let lead = await buscarLeadPorTelefone(supabase, telefone);

  // Guard antigo `lead_em_atendimento_crm_atual` removido — silenciava o bot
  // quando o CRM antigo mexia em `lead_status`. Hoje o controle é só:
  // `bot_pausado` ou `status_sdr` indicar handoff.

  if (!lead) {
    if (!modoTeste)
    // ============================================================
    // CROSS-CHECK ANTES DE CRIAR LEAD NOVO
    // (b) leads_geral com últimos 8 dígitos + status ativo
    // (d) processos vinculados a lead_geral com mesmo telefone
    // → silencia bot, empilha em backlog_triagem
    // ============================================================
    {
      const telefoneDigits = telefone.replace(/\D/g, "");
      const ultimos8b = telefoneDigits.slice(-8);

      // (b) lead_geral existente com status ativo
      const { data: leadAtivo } = await supabase
        .from("leads_geral")
        .select("id, full_name, phone_number, contato_whatsapp, status_sdr, telefone_digits")
        .or(`telefone_digits.like.%${ultimos8b},phone_number.like.%${ultimos8b},contato_whatsapp.like.%${ultimos8b}`)
        .in("status_sdr", ["assumido_humano", "agendado", "cliente", "em_atendimento"])
        .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (leadAtivo) {
        const la: any = leadAtivo;
        try {
          await supabase.from("backlog_triagem").insert({
            motivo: "cliente_em_atendimento",
            telefone,
            telefone_digits: telefoneDigits,
            nome_capturado: la.full_name ?? null,
            msg_recebida: texto,
            lead_existente_id: la.id,
          });
        } catch (_e) { /* ignore */ }

        await registrarEvento(supabase, la.id, "bot_silenciado_cliente_existente", {
          telefone,
          status_sdr: la.status_sdr,
          fromMe: !!payload.fromMe,
        });
        return new Response(
          JSON.stringify({ ignored: "cliente_em_atendimento", backlog: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // (d) processos ativos com lead_geral cujo phone bate
      // Sem teto: filtra leads pelo telefone_digits primeiro (índice), depois cruza com processos ativos.
      const { data: leadsMesmoTel } = await supabase
        .from("leads_geral")
        .select("id, full_name, phone_number, contato_whatsapp, telefone_digits")
        .like("telefone_digits", `%${ultimos8b}`);

      const leadsExatos = (leadsMesmoTel ?? []).filter((lg: any) => {
        const digs = [lg.telefone_digits, lg.phone_number, lg.contato_whatsapp]
          .filter(Boolean)
          .map((x: string) => x.replace(/\D/g, ""));
        return digs.some((d: string) => d.endsWith(ultimos8b));
      });

      let procHit: any = null;
      if (leadsExatos.length > 0) {
        const idsExatos = leadsExatos.map((l: any) => l.id);
        const { data: procMatch } = await supabase
          .from("processos")
          .select("id, lead_id, leads_geral:lead_id(id, full_name, phone_number, contato_whatsapp, telefone_digits)")
          .neq("status", "concluido")
          .in("lead_id", idsExatos)
          .limit(1);
        procHit = (procMatch ?? [])[0] ?? null;
      }

      if (procHit) {
        const pl: any = (procHit as any).leads_geral;
        try {
          await supabase.from("backlog_triagem").insert({
            motivo: "processo_ativo",
            telefone,
            telefone_digits: telefoneDigits,
            nome_capturado: pl?.full_name ?? null,
            msg_recebida: texto,
            lead_existente_id: pl?.id ?? null,
            processo_id: (procHit as any).id,
          });
        } catch (_e) { /* ignore */ }

        await registrarEvento(supabase, pl?.id ?? null, "bot_silenciado_processo_ativo", {
          telefone,
          processo_id: (procHit as any).id,
          fromMe: !!payload.fromMe,
        });
        return new Response(
          JSON.stringify({ ignored: "processo_ativo", backlog: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }


    const p = payload as any;
    const senderName: string | undefined = p.senderName ?? p.chatName ?? p.notifyName;

    // ============================================================
    // Detecção determinística de Click-to-WhatsApp Ads (CTWA)
    // ============================================================
    const adReply = p.externalAdReply ?? null;
    // CTWA: aceita vários sinais do Z-API/Meta (nem sempre vem clickToWhatsappCall)
    const veioDeAnuncio = !!adReply && (
      adReply.clickToWhatsappCall === true ||
      adReply.sourceType === "ad" ||
      !!adReply.ctwaClid ||
      !!adReply.sourceId
    );

    let platform = "whatsapp_organico";
    let adContext: {
      ad_id: string | null;
      ad_name: string | null;
      ad_body: string | null;
      source_url: string | null;
      ctwa_clid: string | null;
      greeting: string | null;
      source_app: string | null;
    } | null = null;

    if (veioDeAnuncio) {
      const sourceApp = (adReply.sourceApp ?? "facebook").toString().toLowerCase();
      platform = sourceApp === "instagram" ? "instagram_ads" : "facebook_ads";
      adContext = {
        ad_id: adReply.sourceId ?? null,
        ad_name: adReply.title ?? null,
        ad_body: adReply.body ?? null,
        source_url: adReply.sourceUrl ?? null,
        ctwa_clid: adReply.ctwaClid ?? null,
        greeting: adReply.greetingMessageBody ?? null,
        source_app: sourceApp,
      };
    }

    await registrarEvento(supabase, null, "lead_auto_criado_payload_debug", {
      telefone, senderName, platform, veioDeAnuncio, adContext,
    });

    // ============================================================
    // FIX RACE — 2 mensagens do mesmo telefone chegando quase juntas
    // criavam 2 leads (e 2 saudações M0). Antes de inserir, verifica
    // se já existe lead desse telefone criado nos últimos 30s.
    // ============================================================
    {
      const tel8Race = telefone.replace(/\D/g, "").slice(-8);
      const desde = new Date(Date.now() - 30_000).toISOString();
      const { data: leadRecente } = await supabase
        .from("leads_geral")
        .select("id")
        .like("telefone_digits", `%${tel8Race}`)
        .gte("created_time", desde)
        .order("created_time", { ascending: false })
        .limit(1);

      if (leadRecente && leadRecente.length > 0) {
        const idExistente = (leadRecente[0] as { id: string }).id;
        await registrarEvento(supabase, idExistente, "lead_criacao_evitada_race", {
          telefone,
          tel8: tel8Race,
          janela_segundos: 30,
        });
        await registrarMensagem(supabase, idExistente, "lead", texto, {
          telefone,
          race_dedup: true,
        });
        return new Response(
          JSON.stringify({ ok: true, acao: "lead_race_reaproveitado", lead_id: idExistente }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    lead = await criarLeadWhatsApp(supabase, {
      nome: senderName ?? "Lead WhatsApp",
      telefone,
      platform,
      origem: veioDeAnuncio ? "meta_lead_ads" : "whatsapp_bot",
      adContext,
    });

    if (!lead) {
      await registrarEvento(supabase, null, "lead_auto_criar_falhou", { telefone });
      return new Response(JSON.stringify({ erro: "criar_lead_falhou" }), { status: 500 });
    }

    // Persiste contexto do anúncio pra ser usado pelo classificador depois
    if (veioDeAnuncio && adContext) {
      await registrarEvento(supabase, lead.id, "lead_criado_via_anuncio", adContext);
    }

    // Registra a mensagem do lead e devolve 200 — o trigger on-new-lead
    // dispara M0 + LGPD. Evita corrida com o classificador.
    await registrarMensagem(supabase, lead.id, "lead", texto, { telefone, primeira_msg: true });
    return new Response(
      JSON.stringify({ ok: true, acao: "lead_auto_criado", lead_id: lead.id, veioDeAnuncio }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Salva a mensagem recebida
  const minhaMsgTs = new Date().toISOString();
  await registrarMensagem(supabase, lead.id, "lead", texto, { telefone, ts: minhaMsgTs });

  // ============================================================
  // CAMPANHA DE RECUPERAÇÃO — detecta resposta e injeta no fluxo M0
  // Se este telefone tem campanhas_envio.status='enviada' sem resposta,
  // marca como respondida, reseta etapa pra M0 e dispara MSG_M0_RECUPERACAO.
  // ============================================================
  try {
    const telefoneDigitsResp = telefone.replace(/\D/g, "");
    const ult8Resp = telefoneDigitsResp.slice(-8);

    const { data: campResp } = await supabase
      .from("campanhas_envio")
      .select("id, lead_geral_id, area, enviada_em, variacao_texto, campanha")
      .eq("status", "enviada")
      .is("respondida_em", null)
      .or(`lead_geral_id.eq.${lead.id},telefone.like.%${ult8Resp}`)
      .order("enviada_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (campResp) {
      const cr: any = campResp;

      // GUARD ANTI-ATROPELO: se humano já assumiu OU mandou msg humana
      // nas últimas 24h, marca campanha como respondida MAS NÃO dispara
      // M0 — bot fica fora pra não atropelar o atendimento humano.
      const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: humanoRecenteCount } = await supabase
        .from("mensagens_sdr")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("origem", "humano")
        .gte("enviada_em", desde24h);

      const humanoAtivo =
        (humanoRecenteCount ?? 0) > 0 ||
        !!(lead as any).humano_responsavel ||
        lead.bot_pausado === true ||
        ["assumido_humano", "agendado", "cliente"].includes((lead.status_sdr ?? "").toString());

      if (humanoAtivo && !modoTeste) {
        await supabase
          .from("campanhas_envio")
          .update({ status: "respondida", respondida_em: minhaMsgTs })
          .eq("id", cr.id);

        await registrarEvento(supabase, lead.id, "campanha_resposta_humano_ja_ativo", {
          campanhas_envio_id: cr.id,
          motivo: "humano_assumiu",
          humano_msgs_24h: humanoRecenteCount ?? 0,
          humano_responsavel: (lead as any).humano_responsavel ?? null,
          bot_pausado: lead.bot_pausado,
          status_sdr: lead.status_sdr,
        });

        return new Response(
          JSON.stringify({ ok: true, acao: "humano_ativo_bot_silenciado_campanha", lead_id: lead.id }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      await supabase
        .from("campanhas_envio")
        .update({ status: "respondida", respondida_em: minhaMsgTs })
        .eq("id", cr.id);

      await supabase
        .from("leads_geral")
        .update({
          status_sdr: "qualificacao_iniciada",
          etapa_qualificacao: "M0",
          tentativas_etapa: 0,
          ultima_msg_cliente_em: minhaMsgTs,
          bot_pausado: false,
          dias_sem_contato: 0,
          origem_sdr: (lead as any).origem_sdr ?? "campanha_recuperacao_2026_06",
        })
        .eq("id", lead.id);

      await registrarEvento(supabase, lead.id, "resposta_campanha_recuperacao", {
        campanhas_envio_id: cr.id,
        area_inicial: cr.area,
        variacao_texto: cr.variacao_texto,
        campanha: cr.campanha,
        msg_cliente: texto,
      });

      const msgM0 = mensagemM0Recuperacao(nomePrimeiro(lead));
      await cadencia();
      const envio = await zapiSendText(telefone, msgM0);
      await registrarMensagem(supabase, lead.id, "bot", msgM0, {
        zapi: envio,
        acao: "m0_recuperacao",
        campanhas_envio_id: cr.id,
      });

      return new Response(
        JSON.stringify({ ok: true, acao: "m0_recuperacao_enviada", lead_id: lead.id }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

  } catch (e) {
    await registrarEvento(supabase, lead.id, "campanha_resposta_erro", {
      erro: (e as Error).message,
    });
  }


  // ============================================================
  // FIX 1 — DEBOUNCE REMOVIDO
  // O debounce com sleep estava descartando TODAS as mensagens
  // (10x descartadas, 0x processadas em 24h). Cada mensagem agora é
  // processada síncrona. Fragmentos são agrupados via "histórico desde
  // última msg do bot" no prompt do classificador. Respostas redundantes
  // são prevenidas pelo Fix 2 (anti-repetição/handoff).
  // ============================================================

  // Agrupa mensagens do lead desde a última msg de bot/humano (ou 60s atrás)
  let textoAgrupado = texto;
  {
    const { data: ultimaBot } = await supabase
      .from("mensagens_sdr")
      .select("enviada_em")
      .eq("lead_id", lead.id)
      .in("origem", ["bot", "humano"])
      .order("enviada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    const desde = (ultimaBot as any)?.enviada_em
      ?? new Date(Date.now() - 60_000).toISOString();
    const { data: msgsLead } = await supabase
      .from("mensagens_sdr")
      .select("conteudo, enviada_em")
      .eq("lead_id", lead.id)
      .eq("origem", "lead")
      .gt("enviada_em", desde)
      .order("enviada_em", { ascending: true });
    const blocos = (msgsLead ?? []).map((m: any) => (m.conteudo ?? "").trim()).filter(Boolean);
    if (blocos.length > 1) {
      textoAgrupado = blocos.join("\n");
      await registrarEvento(supabase, lead.id, "msgs_lead_agrupadas_debounce", {
        total: blocos.length,
        agrupado_preview: textoAgrupado.slice(0, 200),
      });
    }
  }


  // ============================================================
  // REATIVAÇÃO DE LEAD QUE VOLTA APÓS 7+ DIAS
  // - 'cliente' nunca reabre pelo bot (notifica time)
  // - lead com processo ativo nunca reabre pelo bot
  // - status perdido/mql_frio/assumido_humano/sql_aguardando_humano +
  //   ultima_mensagem_em >= 7 dias  →  reabre, reseta etapa, envia
  //   mensagem de reativação
  // ============================================================
  if (!modoTeste) {
    const STATUS_REABRIVEIS = ["perdido", "mql_frio", "assumido_humano", "sql_aguardando_humano"];
    const status = (lead.status_sdr ?? "").toString();

    // Cliente fechado → nunca reabre pelo bot
    if (status === "cliente") {
      await registrarEvento(supabase, lead.id, "cliente_voltou_a_falar", {
        telefone, nome: nomePrimeiro(lead),
      });
      return new Response(JSON.stringify({ acao: "cliente_nao_reabre" }), { status: 200 });
    }

    // Tem processo ativo? Bot fica fora.
    const { count: processosAtivos } = await supabase
      .from("processos")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .neq("status", "concluido");
    if ((processosAtivos ?? 0) > 0) {
      await registrarEvento(supabase, lead.id, "cliente_com_processo_voltou_a_falar", {
        telefone, processos_ativos: processosAtivos,
      });
      return new Response(JSON.stringify({ acao: "cliente_processo_ativo" }), { status: 200 });
    }

    // Reabertura por inatividade >= 7 dias
    if (STATUS_REABRIVEIS.includes(status)) {
      const ultimaIso = (lead as any).ultima_mensagem_em as string | null | undefined;
      // Usa created_at como fallback se nunca houve mensagem registrada
      const referencia = ultimaIso ? new Date(ultimaIso).getTime() : 0;
      const diasInativo = referencia ? (Date.now() - referencia) / 86_400_000 : 999;

      if (diasInativo >= 7) {
        await supabase
          .from("leads_geral")
          .update({
            status_sdr: "em_atendimento_bot",
            bot_pausado: false,
            etapa_qualificacao: "M0",
            area_normalizada: null,
            fluxo_sdr: null,
            humano_responsavel: null,
          })
          .eq("id", lead.id);

        const nomeReab = nomePrimeiro(lead);
        const msgReab = mensagemReabertura(nomeReab);
        await cadencia();
        const envioReab = await zapiSendText(telefone, msgReab);
        await registrarMensagem(supabase, lead.id, "bot", msgReab, {
          zapi: envioReab, acao: "reabertura_7dias",
        });
        await registrarEvento(supabase, lead.id, "lead_reaberto_apos_7dias", {
          status_anterior: status,
          dias_inativo: Math.round(diasInativo),
          ultima_mensagem_em: ultimaIso ?? null,
        });

        // Atualiza estado local pra não cair nos guards abaixo
        lead = { ...lead, status_sdr: "em_atendimento_bot", bot_pausado: false,
                 etapa_qualificacao: "M0", area_normalizada: null } as Lead;

        return new Response(
          JSON.stringify({ ok: true, acao: "lead_reaberto_apos_7dias", lead_id: lead.id }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  // ============================================================
  // CAMADA 2 — GUARD EM TEMPO REAL (lead JÁ existente)
  // Consulta contact_submissions linkado + processos ativos ANTES
  // de responder. Cobre o caso "advogada assumiu no CRM mas o bot
  // não sabe" (status_sdr desatualizado).
  // ============================================================
  if (!modoTeste) {
    const { data: csLinked } = await supabase
      .from("contact_submissions")
      .select("id, estagio, status, responsavel_id, nome_completo")
      .eq("lead_geral_id", lead.id)
      .maybeSingle();

    if (csLinked) {
      const cs: any = csLinked;
      const ESTAGIOS_ATIVOS = ["contato_inicial", "em_analise", "proposta_enviada", "fechado"];
      const estagioAtivo = ESTAGIOS_ATIVOS.includes(cs.estagio);
      const temResponsavel = !!cs.responsavel_id;

      if (estagioAtivo || temResponsavel) {
        // Sincroniza leads_geral pra próximos webhooks pularem antes
        await supabase.from("leads_geral")
          .update({ bot_pausado: true, status_sdr: "assumido_humano" })
          .eq("id", lead.id);

        try {
          await supabase.from("backlog_triagem").insert({
            motivo: "contato_em_andamento",
            telefone,
            telefone_digits: telefone.replace(/\D/g, ""),
            nome_capturado: cs.nome_completo ?? nomePrimeiro(lead),
            msg_recebida: texto,
            contact_submission_id: cs.id,
            lead_existente_id: lead.id,
          });
        } catch (_e) { /* ignore dup */ }

        await registrarEvento(supabase, lead.id, "bot_silenciado_crm_ativo_realtime", {
          telefone,
          contact_submission_id: cs.id,
          estagio: cs.estagio,
          tem_responsavel: temResponsavel,
        });
        return new Response(
          JSON.stringify({ ignored: "crm_ativo_realtime", backlog: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }



  // Comando "parar"
  if (/^\s*parar\s*$/i.test(texto)) {
    await supabase
      .from("leads_geral")
      .update({ status_sdr: "perdido", bot_pausado: true })
      .eq("id", lead.id);
    const msg = `Tudo certo, ${nomePrimeiro(lead)}. Removendo seu contato do nosso atendimento ativo. Se mudar de ideia, é só mandar mensagem aqui 💙`;
    await zapiSendText(telefone, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg);
    return new Response(JSON.stringify({ acao: "opt_out" }), { status: 200 });
  }

  // Bot pausado → humano vai responder
  if (lead.bot_pausado && !modoTeste) {
    await registrarEvento(supabase, lead.id, "msg_recebida_bot_pausado", { texto });
    return new Response(JSON.stringify({ acao: "bot_pausado_humano_assume" }), { status: 200 });
  }

  // Status que não devem disparar bot (cliente, perdido, etc.)
  const statusOk = ["novo", "em_atendimento_bot", "qualificacao_iniciada", null];
  if (!statusOk.includes(lead.status_sdr) && !modoTeste) {
    await registrarEvento(supabase, lead.id, "msg_recebida_status_bloqueia", { status: lead.status_sdr });
    return new Response(JSON.stringify({ acao: "status_bloqueia" }), { status: 200 });
  }

  // Camada 3 — rede de segurança contra fromMe intermitente.
  // Se QUALQUER humano (painel ou fromMe) interagiu nas últimas 24h,
  // bot fica fora pra não atropelar o atendimento humano.
  if (!modoTeste) {
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: humanoCount } = await supabase
      .from("mensagens_sdr")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("origem", "humano")
      .gte("enviada_em", desde);
    if ((humanoCount ?? 0) > 0) {
      await registrarEvento(supabase, lead.id, "humano_ativo_bot_silenciado", {
        humano_msgs_24h: humanoCount,
        texto,
      });
      // Garante bot_pausado=true pra próximos webhooks pularem antes.
      if (!lead.bot_pausado) {
        await supabase.from("leads_geral")
          .update({ bot_pausado: true, status_sdr: "assumido_humano" })
          .eq("id", lead.id);
      }
      return new Response(
        JSON.stringify({ acao: "humano_ativo_bot_silenciado" }),
        { status: 200 },
      );
    }
  }


  // ============================================================
  // GARANTIA DE M0 — toda conversa começa pela saudação.
  // Se o bot ainda não enviou M0 pra este lead, envia agora e encerra
  // a invocação. O classificador só entra a partir da 2ª interação.
  // ============================================================
  {
    const { data: msgsM0 } = await supabase
      .from("mensagens_sdr")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("origem", "bot")
      .filter("metadata->>etapa", "eq", "M0")
      .limit(1);

    if ((msgsM0?.length ?? 0) === 0) {
      const { data: leadForm } = await supabase
        .from("leads_geral")
        .select("oferta_origem, form_flags, stage, sdr_contexto, dados_capturados, flags_qualificacao")
        .eq("id", lead.id)
        .maybeSingle();
      const ofertaM0 = (leadForm?.oferta_origem ?? null) as Oferta | null;
      const ctxM0 = (leadForm?.sdr_contexto ?? null) as SdrContexto | null;
      const areaForm = ofertaM0 ? areaFromOferta(ofertaM0) : null;
      const respostasForm = (ctxM0?.respostas ?? {}) as Record<string, unknown>;
      const dadosForm = areaForm
        ? respostasFormParaDadosBot(areaForm, respostasForm)
        : {};

      // ---------- Lead veio de LP com respostas: não repetir o form ----------
      if (areaForm && Object.keys(dadosForm).length > 0) {
        const TEMA: Record<string, string> = {
          familia: "partilha e divórcio",
          inventario: "inventário",
          saude: "caso com o plano de saúde",
        };
        const pendentes = etapasPendentes(areaForm, dadosForm);
        const dadosPrevM0 = ((leadForm as any)?.dados_capturados ?? {}) as Record<string, unknown>;
        const dadosMergeM0: Record<string, unknown> = {
          ...dadosPrevM0,
          ...dadosForm,
          area: areaForm,
          veio_do_form: true,
        };
        const flagsPrevM0 = ((leadForm as any)?.flags_qualificacao ?? []) as string[];

        const saudacao = `Oi ${nomePrimeiro(lead)}, tudo bem? Aqui é do escritório Borges & Zembruski Advocacia.`;

        if (pendentes.length === 0) {
          // Form completo → M0 de confirmação + handoff direto, sem perguntas.
          const seqArea = SEQUENCIA[areaForm] ?? [];
          const regra = aplicarRegrasV1(
            areaForm,
            seqArea[seqArea.length - 1],
            dadosMergeM0,
          );
          const flagsM0 = [...new Set([...flagsPrevM0, ...regra.flags, "veio_do_form"])];
          const msgCompleto =
            `${saudacao}\n\nRecebemos as informações que você deixou no site. Já anotamos tudo e uma das nossas advogadas entra em contato ainda hoje pra conversar em detalhes com você.`;

          await cadencia();
          const envioC = await zapiSendText(telefone, msgCompleto);
          await registrarMensagem(supabase, lead.id, "bot", msgCompleto, {
            etapa: "M0",
            zapi_status: envioC.status,
            motivo: "m0_form_completo",
            personalizado_form: true,
            handoff: regra.proxima,
          });

          const ehDesq = IDS_DESQUALIFICA.includes(regra.proxima);
          const patchM0: Record<string, unknown> = {
            etapa_qualificacao: regra.proxima,
            area_normalizada: areaForm,
            dados_capturados: dadosMergeM0,
            flags_qualificacao: flagsM0,
            status_sdr: ehDesq ? "desqualificado" : "sql_aguardando_humano",
            bot_pausado: true,
            ultima_mensagem_em: new Date().toISOString(),
          };
          if (ehDesq) {
            patchM0.stage = "desqualificado";
            patchM0.desqualificado_em = new Date().toISOString();
          }
          await supabase.from("leads_geral").update(patchM0).eq("id", lead.id);

          let advogadaId: string | null = null;
          if (!ehDesq) {
            const advogada = await pickAdvogada(supabase, areaForm as AreaHandoff);
            advogadaId = advogada?.id ?? null;
            if (advogada) {
              await supabase.from("leads_geral").update({
                humano_responsavel: advogada.id,
                advogada_responsavel_id: advogada.id,
                stage: "sal",
                prioridade_max: flagsM0.includes("urgente_saude"),
                caso_forte: flagsM0.includes("caso_forte"),
                ticket_minimo: flagsM0.includes("ticket_baixo"),
                produto_diferente: flagsM0.includes("produto_diferente"),
              }).eq("id", lead.id);
            }
            await notificarAdvogado(supabase, lead.id, advogadaId, regra.proxima, {
              prioridadeMax: flagsM0.includes("urgente_saude"),
              flags: {
                caso_forte: flagsM0.includes("caso_forte"),
                ticket_minimo: flagsM0.includes("ticket_baixo"),
                produto_diferente: flagsM0.includes("produto_diferente"),
                prioridade_max: flagsM0.includes("urgente_saude"),
              },
            });
          }

          await registrarEvento(supabase, lead.id, "m0_form_completo_handoff", {
            oferta: ofertaM0,
            area: areaForm,
            handoff: regra.proxima,
            flags: flagsM0,
          });
          return new Response(
            JSON.stringify({ acao: "m0_form_handoff", lead_id: lead.id, etapa: regra.proxima }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        // Form parcial → M0 personalizado + primeira pergunta que faltou.
        const proximaPergunta = pendentes[0];
        const msgParcial =
          `${saudacao}\n\nRecebemos as informações que você deixou no site sobre ${TEMA[areaForm]}. Anotamos tudo e falta só uma última pergunta pra a gente encaminhar pra advogada certa.`;

        await cadencia();
        const envioP = await zapiSendText(telefone, msgParcial);
        await registrarMensagem(supabase, lead.id, "bot", msgParcial, {
          etapa: "M0",
          zapi_status: envioP.status,
          motivo: "m0_form_parcial",
          personalizado_form: true,
          proxima_pergunta: proximaPergunta,
        });

        const textoPergunta = templateV1(proximaPergunta);
        await cadencia();
        const envioQ = await zapiSendText(telefone, textoPergunta);
        await registrarMensagem(supabase, lead.id, "bot", textoPergunta, {
          etapa: proximaPergunta,
          zapi_status: envioQ.status,
          motivo: "pergunta_pendente_form",
        });

        await supabase
          .from("leads_geral")
          .update({
            etapa_qualificacao: proximaPergunta,
            area_normalizada: areaForm,
            dados_capturados: dadosMergeM0,
            flags_qualificacao: [...new Set([...flagsPrevM0, "veio_do_form"])],
            status_sdr: "em_atendimento_bot",
            ultima_mensagem_em: new Date().toISOString(),
          })
          .eq("id", lead.id);

        await registrarEvento(supabase, lead.id, "m0_form_parcial", {
          oferta: ofertaM0,
          area: areaForm,
          pendentes,
          respondidas_form: Object.keys(dadosForm),
        });
        return new Response(
          JSON.stringify({ acao: "m0_form_parcial", lead_id: lead.id, etapa: proximaPergunta }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // ---------- Sem form: fluxo M0 padrão (inalterado) ----------
      const msgM0 = montarM0Personalizado({
        oferta: ofertaM0,
        stage: (leadForm?.stage ?? "mql") as StageDecisao,
        flags: (leadForm?.form_flags ?? []) as string[],
        contexto: ctxM0,
      });

      if (ofertaM0) {
        const checkM0 = validarMensagemDoBot(ofertaM0, msgM0);
        if (!checkM0.ok) {
          await supabase.from("bot_errors").insert({
            lead_id: lead.id,
            motivo: checkM0.motivo,
            mensagem: msgM0,
            oferta: ofertaM0,
          });
          await registrarEvento(supabase, lead.id, "bot_msg_bloqueada", {
            motivo: checkM0.motivo,
            origem: "m0_garantido",
          });
          return new Response(
            JSON.stringify({ acao: "m0_bloqueado", motivo: checkM0.motivo }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
      }

      await cadencia();
      const envio = await zapiSendText(telefone, msgM0);
      await registrarMensagem(supabase, lead.id, "bot", msgM0, {
        etapa: "M0",
        zapi_status: envio.status,
        motivo: "m0_garantido",
        personalizado_form: !!(ofertaM0 && ctxM0?.respostas),
      });
      await supabase
        .from("leads_geral")
        .update({
          etapa_qualificacao: "M0",
          status_sdr: "em_atendimento_bot",
          ultima_mensagem_em: new Date().toISOString(),
        })
        .eq("id", lead.id);
      await registrarEvento(supabase, lead.id, "m0_enviado_garantido", { telefone });
      return new Response(
        JSON.stringify({ acao: "m0_enviado", lead_id: lead.id }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Monta contexto pra Claude (inclui sdr_contexto do form)
  const { data: leadCtxRow } = await supabase
    .from("leads_geral")
    .select("oferta_origem, form_flags, form_score, stage, sdr_contexto, full_name")
    .eq("id", lead.id)
    .maybeSingle();

  const historico = await historicoMensagens(supabase, lead.id, 12);
  const contexto = {
    nome: nomePrimeiro(lead),
    tipo_servico_form: lead.tipo_servico,
    origem: lead.origem_sdr,
    etapa_atual: lead.etapa_qualificacao,
    area_atual: lead.area_normalizada,
    score_atual: lead.score,
    oferta_origem: leadCtxRow?.oferta_origem ?? null,
    form_flags: leadCtxRow?.form_flags ?? null,
    respostas_form: (leadCtxRow?.sdr_contexto as SdrContexto | null)?.respostas ?? null,
  };

  // Se o lead veio de anúncio (CTWA), busca o contexto do anúncio pra
  // injetar no prompt do classificador. Resolve o caso do lead que só
  // manda "Oi" mas o anúncio era sobre área específica.
  let adContextoStr = "";
  {
    const { data: leadAd } = await supabase
      .from("leads_geral")
      .select("platform, ad_name")
      .eq("id", lead.id)
      .maybeSingle();
    const plat = (leadAd as any)?.platform as string | undefined;
    if (plat && plat.endsWith("_ads")) {
      const { data: ev } = await supabase
        .from("eventos_sdr")
        .select("payload")
        .eq("lead_id", lead.id)
        .eq("tipo", "lead_criado_via_anuncio")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const ad = (ev as any)?.payload ?? null;
      if (ad) {
        adContextoStr = `\n\nIMPORTANTE: este lead chegou clicando em um anúncio (${plat}). Use o conteúdo do anúncio abaixo pra inferir a área mesmo que a primeira mensagem seja genérica:\n• Título do anúncio: ${ad.ad_name ?? "(sem título)"}\n• Texto do anúncio: ${ad.ad_body ?? "(sem texto)"}\n• Mensagem inicial automática que o lead viu: ${ad.greeting ?? "(nenhuma)"}\n`;
      }
    }
  }

  const userPrompt = `Contexto do lead:
${JSON.stringify(contexto, null, 2)}${adContextoStr}

Histórico (mais antigo para mais recente):
${historico.map((m) => `[${m.origem}] ${m.conteudo}`).join("\n")}

Última mensagem do lead (a que você precisa interpretar; pode conter várias linhas se o lead mandou mensagens fragmentadas em sequência, trate como um bloco único):
"${textoAgrupado}"

Decida a próxima etapa seguindo as regras do system prompt e retorne o JSON.`;

  const systemPrompt = systemPromptComContexto({
    systemBase: SYSTEM_PROMPT_ROTEIRO_V1,
    lead: {
      nome: leadCtxRow?.full_name ?? lead.full_name,
      oferta_origem: leadCtxRow?.oferta_origem ?? null,
      stage: leadCtxRow?.stage ?? null,
      form_flags: (leadCtxRow?.form_flags as string[] | null) ?? null,
      form_score: (leadCtxRow?.form_score as number | null) ?? null,
      sdr_contexto: (leadCtxRow?.sdr_contexto as SdrContexto | null) ?? null,
    },
  });

  let classificacao: ClaudeJsonResult<ClassificacaoV1>;
  try {
    classificacao = await claudeJson<ClassificacaoV1>(
      systemPrompt,
      [{ role: "user", content: userPrompt }],
      { maxTokens: 1024, temperature: 0.2 },
    );
  } catch (e) {
    await registrarEvento(supabase, lead.id, "haiku_falhou", {
      erro: (e as Error)?.message ?? String(e),
      stack: (e as Error)?.stack ?? null,
      etapa: lead.etapa_qualificacao,
      fase: "exception",
    });
    return new Response(JSON.stringify({ erro: "haiku_exception" }), { status: 500 });
  }

  if (!classificacao.ok || !classificacao.data) {
    await registrarEvento(supabase, lead.id, "haiku_falhou", {
      erro: classificacao.error,
      raw: classificacao.rawText,
      etapa: lead.etapa_qualificacao,
      fase: "resposta_invalida",
    });
    await registrarEvento(supabase, lead.id, "claude_falhou", {
      erro: classificacao.error,
      raw: classificacao.rawText,
    });
    return new Response(JSON.stringify({ erro: classificacao.error }), { status: 500 });
  }


  const r = classificacao.data;
  const etapaAnterior = (lead.etapa_qualificacao ?? "M0").toString();
  const nome = nomePrimeiro(lead);

  const AREAS_QUALIF = ["familia", "inventario", "saude"];
  const areaBruta = (r.area ?? "nao_claro").toString().toLowerCase();
  const areaPrevia = (lead.area_normalizada ?? "").toString().toLowerCase();
  const areaAtual = AREAS_QUALIF.includes(areaBruta)
    ? areaBruta
    : (AREAS_QUALIF.includes(areaPrevia) ? areaPrevia : areaBruta);

  // ---------- Acumula respostas ----------
  const { data: leadAtual } = await supabase
    .from("leads_geral")
    .select("dados_capturados, flags_qualificacao, tipo_servico")
    .eq("id", lead.id)
    .maybeSingle();

  const dadosPrev = ((leadAtual as any)?.dados_capturados ?? {}) as Record<string, unknown>;
  const respostaAgora = (r.resposta_estruturada ?? {}) as Record<string, unknown>;
  const dadosMerge: Record<string, unknown> = {
    ...dadosPrev,
    ...respostaAgora,
    ...(AREAS_QUALIF.includes(areaAtual) ? { area: areaAtual } : {}),
  };

  // ---------- Persiste a resposta desta etapa em qualificacoes_sdr ----------
  {
    const chaveEtapa = CHAVE_POR_ETAPA[etapaAnterior];
    const perguntaCodigo = etapaAnterior;
    const estruturada: Record<string, unknown> = chaveEtapa
      ? { [chaveEtapa]: dadosMerge[chaveEtapa] ?? respostaAgora[chaveEtapa] ?? textoAgrupado }
      : { area: areaBruta, subclassificacao: r.subclassificacao ?? null };

    const { error: qErr } = await supabase.from("qualificacoes_sdr").upsert({
      lead_id: lead.id,
      pergunta_codigo: perguntaCodigo,
      pergunta_texto: PERGUNTA_TEXTO_V1[perguntaCodigo] ?? perguntaCodigo,
      resposta_texto: textoAgrupado,
      resposta_estruturada: estruturada,
    }, { onConflict: "lead_id,pergunta_codigo" });
    if (qErr) console.error("[qualificacoes_sdr] erro:", qErr);
  }

  // ---------- Decide a próxima mensagem do roteiro ----------
  let proximaId: string;
  let flags: string[] = [...(r.flags_a_adicionar ?? [])].map((f) => String(f));

  if (areaBruta === "pensao_guarda_apenas") {
    proximaId = "M-A";
    flags.push("desqualificado_pensao_guarda");
  } else if (areaBruta === "fora_escopo") {
    proximaId = "M-B";
    flags.push("desqualificado_fora_escopo");
  } else if (AREAS_QUALIF.includes(areaAtual)) {
    const seq = SEQUENCIA[areaAtual];
    if (!seq.includes(etapaAnterior)) {
      proximaId = seq[0];
    } else {
      const regra = aplicarRegrasV1(areaAtual, etapaAnterior, dadosMerge);
      proximaId = regra.proxima;
      flags.push(...regra.flags);
    }

    // Pula etapas já respondidas no form (nunca repetir pergunta do LP)
    const ofertaLead = (leadCtxRow?.oferta_origem ?? null) as Oferta | null;
    const respostasForm =
      ((leadCtxRow?.sdr_contexto as SdrContexto | null)?.respostas ?? {}) as Record<
        string,
        string | string[]
      >;
    if (ofertaLead && ETAPA_ROTEIRO_POR_CAMPO[ofertaLead]) {
      const mapa = ETAPA_ROTEIRO_POR_CAMPO[ofertaLead];
      const areaForm = areaFromOferta(ofertaLead);
      if (areaForm === areaAtual) {
        let guard = 0;
        while (guard < 6 && seq.includes(proximaId)) {
          const campo = Object.entries(mapa).find(([, mid]) => mid === proximaId)?.[0];
          if (!campo) break;
          const v = respostasForm[campo];
          const filled = Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
          if (!filled) break;
          // injeta no merge e avança
          dadosMerge[CHAVE_POR_ETAPA[proximaId] ?? campo] = v;
          const regraSkip = aplicarRegrasV1(areaAtual, proximaId, dadosMerge);
          proximaId = regraSkip.proxima;
          flags.push(...regraSkip.flags, `SKIP_FORM:${campo}`);
          guard += 1;
        }
      }
    }
  } else {
    proximaId = "M1";
  }
  if (proximaId === "M5C-Desq") flags.push("desqualificado_ticket_baixo");
  flags = [...new Set(flags.filter(Boolean))];

  const ehHandoff = IDS_HANDOFF.includes(proximaId);
  const ehDesqualifica = IDS_DESQUALIFICA.includes(proximaId);

  let mensagemFinal = templateV1(proximaId);
  let novaEtapa = proximaId;
  let novoStatus = "em_atendimento_bot";
  let pausarBot = false;
  let encerramento = false;
  let advogadoIdNotificar: string | null = null;
  const flagsHandoff: Record<string, boolean> = {
    caso_forte: flags.includes("caso_forte"),
    ticket_minimo: flags.includes("ticket_baixo"),
    produto_diferente: flags.includes("produto_diferente"),
    prioridade_max: flags.includes("urgente_saude"),
  };

  if (ehHandoff) {
    novoStatus = "sql_aguardando_humano";
    pausarBot = true;
    encerramento = true;
  } else if (ehDesqualifica) {
    novoStatus = "desqualificado";
    pausarBot = true;
  }

  // Flags acumuladas
  const flagsPrev = ((leadAtual as any)?.flags_qualificacao ?? []) as string[];
  const flagsMerge = [...new Set([...(flagsPrev ?? []), ...flags])];

  const urgenciaTxt = String(dadosMerge.urgencia ?? "");
  const urgenciaNorm = /extrema/i.test(urgenciaTxt)
    ? "alta"
    : /30 dias/i.test(urgenciaTxt)
    ? "media"
    : /sem urg/i.test(urgenciaTxt)
    ? "baixa"
    : null;

  const patchLead: Record<string, unknown> = {
    area_normalizada: AREAS_QUALIF.includes(areaAtual) ? areaAtual : (lead.area_normalizada ?? null),
    fluxo_sdr: fluxoFromArea(AREAS_QUALIF.includes(areaAtual) ? areaAtual : null),
    dados_capturados: dadosMerge,
    flags_qualificacao: flagsMerge,
    motivo_qualificacao: r.subclassificacao ?? null,
  };
  if (r.subclassificacao) patchLead.tipo_servico = r.subclassificacao;
  if (urgenciaNorm) patchLead.urgencia = urgenciaNorm;
  if (ehDesqualifica) {
    patchLead.stage = "desqualificado";
    patchLead.desqualificado_motivo = flags.find((f) => f.startsWith("desqualificado_")) ?? "desqualificado";
    patchLead.desqualificado_em = new Date().toISOString();
  }
  await supabase.from("leads_geral").update(patchLead).eq("id", lead.id);

  // ---------- Handoff comercial ----------
  if (ehHandoff) {
    const areaHandoff = (AREAS_QUALIF.includes(areaAtual) ? areaAtual : "familia") as AreaHandoff;
    const advogada = await pickAdvogada(supabase, areaHandoff);
    advogadoIdNotificar = advogada?.id ?? null;
    if (advogada) {
      await supabase.from("leads_geral").update({
        humano_responsavel: advogada.id,
        advogada_responsavel_id: advogada.id,
        stage: "sal",
        prioridade_max: flagsHandoff.prioridade_max,
        caso_forte: flagsHandoff.caso_forte,
        ticket_minimo: flagsHandoff.ticket_minimo,
        produto_diferente: flagsHandoff.produto_diferente,
      }).eq("id", lead.id);
    }
  }

  // ---------- Notificação IN-APP urgente (Saúde) ----------
  if (flags.includes("urgente_saude") && !flagsPrev.includes("urgente_saude")) {
    await notificarUrgenteInApp(supabase, lead.id, lead.full_name ?? nome);
  }

  // ============================================================
  // LIMITE DE TENTATIVAS POR ETAPA (preservado)
  // ============================================================
  const avancouEtapa = novaEtapa !== etapaAnterior;
  const tentativasAtuais = (lead as any).tentativas_etapa ?? 0;
  let tentativasNovas = avancouEtapa ? 0 : tentativasAtuais + 1;

  if (!avancouEtapa && tentativasNovas >= 2 && !encerramento && !ehDesqualifica) {
    await registrarEvento(supabase, lead.id, "bot_handoff_por_tentativas_excedidas", {
      etapa: etapaAnterior,
      tentativas: tentativasNovas,
      proxima_sugerida: proximaId,
    });
    mensagemFinal = templateV1("M5C").replace(
      "Uma das nossas advogadas entra em contato ainda hoje pra conversar em detalhes com você.",
      "Uma das nossas advogadas entra em contato pra conversar em detalhes com você.",
    );
    novoStatus = "sql_aguardando_humano";
    pausarBot = true;
    encerramento = true;
    tentativasNovas = 0;
    const advogado = await buscarAdvogadoPorArea(supabase, areaAtual ?? "geral");
    advogadoIdNotificar = advogado?.id ?? null;
    if (advogado) {
      await supabase.from("leads_geral")
        .update({ humano_responsavel: advogado.id })
        .eq("id", lead.id);
    }
    try {
      await supabase.from("backlog_triagem").insert({
        motivo: "duvida_classificacao",
        telefone,
        telefone_digits: telefone.replace(/\D/g, ""),
        nome_capturado: lead.full_name ?? null,
        msg_recebida: textoAgrupado,
        lead_existente_id: lead.id,
      });
    } catch (_e) { /* ignore */ }
  }

  // ============================================================
  // ANTI-REPETIÇÃO (Jaccard 0.85, preservado)
  // ============================================================
  {
    const { data: ultimaBotMsg } = await supabase
      .from("mensagens_sdr")
      .select("conteudo")
      .eq("lead_id", lead.id)
      .eq("origem", "bot")
      .order("enviada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ultimoTxt = ((ultimaBotMsg as any)?.conteudo ?? "").toString();
    const sim = similaridade(ultimoTxt, mensagemFinal);
    if (ultimoTxt && sim >= 0.85 && !encerramento && !ehDesqualifica) {
      await registrarEvento(supabase, lead.id, "bot_evitou_repetir_handoff", {
        similaridade: Number(sim.toFixed(3)),
        preview_anterior: ultimoTxt.slice(0, 120),
        preview_nova: mensagemFinal.slice(0, 120),
        etapa_original: proximaId,
      });
      mensagemFinal = templateV1("M5C");
      novaEtapa = "M5C";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      encerramento = true;
      tentativasNovas = 0;
      const advogado = await buscarAdvogadoPorArea(supabase, areaAtual ?? "geral");
      advogadoIdNotificar = advogado?.id ?? null;
      if (advogado) {
        await supabase.from("leads_geral")
          .update({ humano_responsavel: advogado.id })
          .eq("id", lead.id);
      }
    }
  }

  // ---------- Guard-rail: não enviar pergunta já respondida no form ----------
  {
    const ofertaGuard = (leadCtxRow?.oferta_origem ?? null) as string | null;
    if (ofertaGuard) {
      const check = validarMensagemDoBot(ofertaGuard, mensagemFinal);
      if (!check.ok) {
        await supabase.from("bot_errors").insert({
          lead_id: lead.id,
          motivo: check.motivo,
          mensagem: mensagemFinal,
          oferta: ofertaGuard,
        });
        await registrarEvento(supabase, lead.id, "bot_msg_bloqueada", {
          motivo: check.motivo,
          etapa: novaEtapa,
          origem: "whatsapp-inbound",
        });
        // Silencioso pro cliente — humano corrige
        return new Response(
          JSON.stringify({ blocked: true, motivo: check.motivo }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  // ---------- Cadência humana: 2 a 4s antes de falar ----------
  await cadencia();

  const envio = await zapiSendText(telefone, mensagemFinal);
  await registrarMensagem(supabase, lead.id, "bot", mensagemFinal, {
    zapi: envio,
    etapa: novaEtapa,
    flags,
  });

  await supabase
    .from("leads_geral")
    .update({
      etapa_qualificacao: novaEtapa,
      status_sdr: novoStatus,
      bot_pausado: pausarBot ? true : (lead.bot_pausado ?? false),
      tentativas_etapa: tentativasNovas,
    })
    .eq("id", lead.id);

  await espelharContactSubmission(supabase, {
    ...lead,
    area_normalizada: AREAS_QUALIF.includes(areaAtual) ? areaAtual : lead.area_normalizada,
    status_sdr: novoStatus,
  });

  if (encerramento) {
    await notificarAdvogado(
      supabase,
      lead.id,
      advogadoIdNotificar,
      novaEtapa,
      { prioridadeMax: flagsHandoff.prioridade_max, flags: flagsHandoff },
    );
  }

  await registrarEvento(supabase, lead.id, "msg_processada", {
    area: areaBruta,
    area_persistida: areaAtual,
    etapa_anterior: etapaAnterior,
    etapa_nova: novaEtapa,
    flags,
    subclassificacao: r.subclassificacao ?? null,
  });

  return new Response(JSON.stringify({ ok: true, etapa: novaEtapa, flags }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Notificação IN-APP urgente de Saúde. Cria uma notificação por usuário
 * do sistema, pra qualquer pessoa logada ver o pop-up piscando.
 * Nada de WhatsApp externo aqui.
 */
async function notificarUrgenteInApp(supabase: any, leadId: string, nomeLead: string) {
  const { data: usuarios } = await supabase.from("profiles").select("id");
  const linhas = (usuarios ?? []).map((u: any) => ({
    usuario_id: u.id,
    tipo: "urgente_saude",
    titulo: "🚨 URGENTE — SAÚDE",
    descricao: `Lead ${nomeLead || "(sem nome)"} com risco de vida. Ver caso.`,
    link: `/dashboard/leads?id=${leadId}`,
    metadata: { leadId, urgente: true, area: "saude" },
  }));
  if (linhas.length === 0) return;
  const { error } = await supabase.from("notificacoes").insert(linhas);
  if (error) console.error("[notificacao urgente] erro:", error);
  await registrarEvento(supabase, leadId, "notificacao_urgente_saude_in_app", {
    destinatarios: linhas.length,
  });
}

async function notificarAdvogado(
  supabase: any,
  leadId: string,
  advogadoId: string | null,
  etapa: string,
  opts: {
    prioridadeMax?: boolean;
    flags?: Record<string, boolean>;
    nota?: string;
  } = {},
) {
  const { data: lead } = await supabase
    .from("leads_geral")
    .select(
      "full_name, phone_number, contato_whatsapp, area_normalizada, tipo_servico, score, prioridade_max, caso_forte, ticket_minimo, produto_diferente",
    )
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return;

  let adv: { nome: string; email: string | null; telefone: string | null } | null = null;
  if (advogadoId) {
    const { data } = await supabase
      .from("advogados_sdr")
      .select("nome, email, telefone")
      .eq("id", advogadoId)
      .maybeSingle();
    adv = (data as any) ?? null;
  }
  if (!adv) {
    const area = (lead.area_normalizada ?? "familia") as AreaHandoff;
    const picked = ["familia", "inventario", "saude"].includes(area)
      ? await pickAdvogada(supabase, area)
      : await buscarAdvogadoPorArea(supabase, area);
    if (picked) adv = { nome: picked.nome, email: picked.email, telefone: picked.telefone };
  }

  const urlPainel = Deno.env.get("URL_PAINEL") ?? "https://gestao.borgesezembruski.com";
  const tel = lead.contato_whatsapp ?? lead.phone_number ?? "";
  const nomeLead = lead.full_name ?? "(sem nome)";
  const urgencia = opts.prioridadeMax || lead.prioridade_max;
  const prefix = urgencia ? "🚨 " : "";

  let texto: string;
  if (lead.area_normalizada === "familia") {
    // Roteiro 2.2 — template Família
    texto =
      `${prefix}Novo lead qualificado: ${nomeLead}, ${tel}. Divórcio + Partilha. Ver detalhes: ${urlPainel}/dashboard/leads/${leadId}`;
  } else if (lead.area_normalizada === "fora_escopo") {
    texto =
      `${prefix}Lead fora de escopo, triagem manual\n\n• Nome: ${nomeLead}\n• WhatsApp: ${tel}\n• Abrir: ${urlPainel}/dashboard/leads/${leadId}`;
  } else {
    const flagsTxt = [
      lead.caso_forte || opts.flags?.caso_forte ? "caso_forte" : null,
      lead.ticket_minimo || opts.flags?.ticket_minimo ? "ticket_minimo" : null,
      lead.produto_diferente || opts.flags?.produto_diferente ? "produto_diferente" : null,
    ].filter(Boolean).join(", ");
    texto =
`${prefix}Novo SQL na sua fila

• Nome: ${nomeLead}
• WhatsApp: ${tel}
• Área: ${lead.area_normalizada ?? lead.tipo_servico ?? "n/d"}
• Score: ${lead.score ?? 0}
• Etapa: ${etapa}${flagsTxt ? `\n• Flags: ${flagsTxt}` : ""}${opts.nota ? `\n• Nota: ${opts.nota}` : ""}

Abrir conversa: ${urlPainel}/dashboard/leads/${leadId}`;
  }

  if (adv?.telefone) {
    await zapiSendText(adv.telefone, texto);
  }

  await registrarEvento(supabase, leadId, "advogado_notificado", {
    advogado_id: advogadoId,
    advogado_resolvido: adv?.nome ?? null,
    canal: adv?.telefone ? "whatsapp" : "sem_canal",
    etapa,
    prioridade_max: !!urgencia,
  });
}

// Higienizacao do tom Claudia: troca travessao por virgula+espaco e
// remove emojis fora da lista permitida (💙 😊). O Haiku pode escorregar
// no system prompt; isso protege a saida final.
function higienizarTomClaudia(s: string): string {
  if (!s) return s;
  let out = s.replace(/\s*[—–]\s*/g, ", ");
  // Mantem somente 💙 e 😊. Remove os outros emojis comuns.
  out = out.replace(/[🤓✱✨🙏👋🎉💪🔥]/g, "");
  return out.replace(/\s{2,}/g, " ").trim();
}

// Similaridade simples baseada em Jaccard de bigramas (caracteres).
// Retorna 0..1. Boa o suficiente pra pegar "mesma mensagem" mesmo com
// pequenas variações (nome no início, pontuação diferente).
function similaridade(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const bigrams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
  };
  const sa = bigrams(A);
  const sb = bigrams(B);
  let inter = 0;
  for (const g of sa) if (sb.has(g)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}
