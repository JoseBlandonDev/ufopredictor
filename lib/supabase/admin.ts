import "server-only";

import { createClient } from "@supabase/supabase-js";

function requireServerEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Configure Supabase server environment variables before creating an admin client.`);
  }

  return value;
}

function getPublicSupabaseConfig() {
  return {
    url: requireServerEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireServerEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = requireServerEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
