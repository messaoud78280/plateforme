import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Client Supabase pour le navigateur (composants client).
 * Retourne null si les variables d'environnement ne sont pas configurées.
 */
export function createBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Client Supabase pour le serveur (Route Handlers, Server Components).
 * Retourne null si les variables d'environnement ne sont pas configurées.
 */
export function createServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
