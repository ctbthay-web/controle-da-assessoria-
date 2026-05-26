import { createClient } from "@supabase/supabase-js";

let supabaseClient: any = null;

/**
 * Retorna uma instância do cliente Supabase para o Frontend (Client-side).
 * Inicializado de forma "lazy" para evitar que o app quebre durante o carregamento
 * caso as chaves ainda não tenham sido configuradas no menu de Configurações.
 */
export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Chaves do Supabase não configuradas. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env");
      throw new Error(
        "Credenciais do Supabase ausentes. Por favor, adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no menu de configurações do projeto para carregar as informações em tempo real."
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

/**
 * Retorna uma instância do cliente Supabase para o Backend (Server-side/Node.js).
 * Útil para operações que requerem a chave Admin (Service Role) ignorando políticas de segurança (RLS).
 */
export function getServerSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Credenciais do Supabase para servidor ausentes. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
