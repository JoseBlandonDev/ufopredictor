import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireServerEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Configure Supabase server environment variables before creating a server client.`);
  }

  return value;
}

function getPublicSupabaseConfig() {
  return {
    url: requireServerEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireServerEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getPublicSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; session refresh belongs in a future auth proxy.
        }
      },
    },
  });
}

