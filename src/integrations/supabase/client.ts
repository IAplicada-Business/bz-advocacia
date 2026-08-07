// Lovable Cloud / Vite — client do frontend.
// Fallback com URL + anon key públicas do projeto (role=anon).
// Envs VITE_* ainda têm prioridade quando o publish as injeta.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const FALLBACK_URL = "https://nvkxblrwblhvggndlfax.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52a3hibHJ3YmxodmdnbmRsZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTA1MzEsImV4cCI6MjA3NzA2NjUzMX0.JvKdsSY-oMk0eYyuqo9u4YmsEm6K9l1mNjNoNn3oKqg";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
