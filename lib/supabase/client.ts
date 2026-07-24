import { createBrowserClient } from "@supabase/ssr";

/**
 * lib/supabase/client.ts
 *
 * Browser-side Supabase client for use in Client Components.
 * Uses the anon key — all data access is governed by RLS policies.
 *
 * Usage:
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *   const { data } = await supabase.from("projects").select("*");
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
