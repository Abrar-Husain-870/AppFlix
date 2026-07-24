import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts
 *
 * Supabase session refresh middleware — runs on every request.
 *
 * WHY THIS IS CRITICAL:
 * Supabase Auth uses short-lived JWT access tokens (default 1 hour). When
 * the token expires, `supabase.auth.getUser()` in Server Components and Server
 * Actions silently returns null, causing the user to appear logged-out even
 * though their refresh token is still valid. This middleware intercepts every
 * request, calls `getUser()` to trigger a silent token refresh, and writes
 * the new access token back into the response cookies — keeping the session alive.
 *
 * Without this file, users will be randomly logged out after ~1 hour.
 *
 * Pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  // Start with an unmodified response.
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Set cookies on the outgoing request so Server Components
          //    in this render cycle can read the refreshed token.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // 2. Rebuild the response with the updated request cookies.
          supabaseResponse = NextResponse.next({ request });

          // 3. Set the updated cookies on the response so the browser
          //    receives them and sends them on the next request.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add any logic between createServerClient and
  // supabase.auth.getUser(). A subtle bug can make it very hard to debug
  // issues with users being randomly logged out.
  //
  // getUser() validates the JWT against the Supabase server on every call,
  // so it is always accurate. It also triggers a silent token refresh if needed.
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * Matcher config: run middleware on all routes EXCEPT:
 *   - _next/static  — compiled JS/CSS assets
 *   - _next/image   — Next.js image optimization
 *   - favicon.ico   — browser tab icon
 *   - public files  — images, fonts, etc. served from /public
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
