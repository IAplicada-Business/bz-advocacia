import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { isSupabaseConfigured } from "./integrations/supabase/client";
import "./index.css";

const rootEl = document.getElementById("root")!;

// Build sem VITE_SUPABASE_URL → antes gerava tela branca ("supabaseUrl is required").
if (!isSupabaseConfigured) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:24px;background:#faf8f5;color:#1a1a1a;">
      <div style="max-width:420px;text-align:center;">
        <p style="font-size:1.25rem;font-weight:600;margin:0 0 8px;">Configuração ausente</p>
        <p style="margin:0;line-height:1.5;color:#555;">
          O frontend foi publicado sem <code>VITE_SUPABASE_URL</code> /
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          Configure essas variáveis no Lovable Cloud e republiche.
        </p>
      </div>
    </div>
  `;
} else {
  // Phase 2.3 — React Query defaults tuned for the BZ Advocacia workload.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  createRoot(rootEl).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}
