// Notifica desqualificação (pensão/guarda) — registra evento; Slack opcional via env.

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || !auth.includes(serviceKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { lead_id?: string; motivo?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
    { auth: { persistSession: false } },
  );

  await supabase.from("eventos_sdr").insert({
    lead_id: body.lead_id ?? null,
    tipo: "desq_notify_mariana",
    payload: {
      motivo: body.motivo ?? null,
      lead_id: body.lead_id ?? null,
    },
  });

  const webhook = Deno.env.get("SLACK_WEBHOOK_MARIANA") ?? Deno.env.get("SLACK_WEBHOOK_URL");
  if (webhook && body.lead_id) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Desqualificado (pensão/guarda) — lead ${body.lead_id}. Motivo: ${body.motivo ?? "—"}`,
        }),
      });
    } catch (e) {
      console.error("[notify-mariana-desq] slack failed:", e);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
