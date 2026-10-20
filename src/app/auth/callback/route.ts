import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/?justLoggedIn=true'
  // Prevent open-redirect vulnerabilities: ensure next starts with '/' and not '//'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/?justLoggedIn=true'

  // Handle provider-level error (e.g. user canceled Google OAuth consent)
  const providerError = searchParams.get('error_description') || searchParams.get('error')
  if (providerError) {
    console.warn('[auth/callback] Provider error:', providerError)
    const errHtml = `<!DOCTYPE html>
<html>
<head><title>Authentication Error</title></head>
<body style="background:#080808;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;">
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'APPFLIX_OAUTH_ERROR', error: ${JSON.stringify(providerError)} }, ${JSON.stringify(origin)});
      window.close();
    } else {
      window.location.href = ${JSON.stringify(`${origin}/login?error=${encodeURIComponent(providerError)}`)};
    }
  </script>
</body>
</html>`
    return new NextResponse(errHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const successHtml = `<!DOCTYPE html>
<html>
<head><title>AppFlix Authentication</title></head>
<body style="background:#080808;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;">
  <p style="font-size:1.1rem;color:#ccc;">Completing sign in...</p>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'APPFLIX_OAUTH_SUCCESS', next: ${JSON.stringify(next)} }, ${JSON.stringify(origin)});
      window.close();
    } else {
      window.location.href = ${JSON.stringify(`${origin}${next}`)};
    }
  </script>
</body>
</html>`

      return new NextResponse(successHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    const failHtml = `<!DOCTYPE html>
<html>
<head><title>Authentication Error</title></head>
<body style="background:#080808;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;">
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'APPFLIX_OAUTH_ERROR', error: ${JSON.stringify(error.message)} }, ${JSON.stringify(origin)});
      window.close();
    } else {
      window.location.href = ${JSON.stringify(`${origin}/login?error=${encodeURIComponent(error.message)}`)};
    }
  </script>
</body>
</html>`
    return new NextResponse(failHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed%20or%20missing%20code`)
}
