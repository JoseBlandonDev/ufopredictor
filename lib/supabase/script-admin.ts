import { createClient } from "@supabase/supabase-js";

// Local/manual scripts only. This helper uses the service role key and bypasses RLS.
// Do not import it from UI, app routes, components, or browser-facing code.
function requireScriptEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Configure Supabase script environment variables before creating a script admin client.`,
    );
  }

  return value;
}

export function createSupabaseScriptAdminClient() {
  const url = requireScriptEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireScriptEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
