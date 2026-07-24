import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * lib/supabase/server.ts
 *
 * Server-side Supabase client for use in:
 *   - Server Components
 *   - Server Actions  (writes, mutations, admin operations)
 *   - Route Handlers  (if ever needed for webhooks)
 *
 * Reads and writes cookies via next/headers to keep the user session
 * in sync across the request/response cycle. This is the @supabase/ssr
 * pattern — do NOT use createClient() from @supabase/supabase-js here.
 *
 * Usage in a Server Component:
 *   import { createServerClient } from "@/lib/supabase/server";
 *   const supabase = await createServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * Usage in a Server Action:
 *   "use server";
 *   import { createServerClient } from "@/lib/supabase/server";
 *   export async function myAction() {
 *     const supabase = await createServerClient();
 *     ...
 *   }
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component (read-only context).
            // Middleware handles the cookie refresh in that case.
          }
        },
      },
    }
  );
}

/**
 * createServiceRoleClient
 *
 * Uses the service role key — bypasses RLS entirely.
 * ONLY for admin Server Actions (e.g. approve/reject projects, send notifications).
 * NEVER import this into a client component or expose to the browser.
 */
export async function createServiceRoleClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // no-op in read-only context
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
