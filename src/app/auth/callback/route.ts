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
<head>
  <meta charset="utf-8">
  <title>Authentication Error</title>
  <style>
    body { background: #080808; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; padding: 2rem; }
    h2 { color: #ff5555; margin-bottom: 0.5rem; font-size: 1.25rem; }
    p { color: #888; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Authentication Failed</h2>
    <p>${providerError}</p>
  </div>
  <script>
    const payload = { type: 'APPFLIX_OAUTH_ERROR', error: ${JSON.stringify(providerError)} };
    try {
      const bc = new BroadcastChannel('appflix_oauth_channel');
      bc.postMessage(payload);
      bc.close();
    } catch (e) {}
    try {
      localStorage.setItem('appflix_oauth_result', JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch (e) {}
    try {
      if (window.opener) {
        window.opener.postMessage(payload, ${JSON.stringify(origin)});
      }
    } catch (e) {}
    setTimeout(() => {
      try { window.close(); } catch(e) {}
    }, 100);
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
<head>
  <meta charset="utf-8">
  <title>Completing Sign In...</title>
  <style>
    body { background: #080808; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #E50914; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.25rem; color: #fff; }
    p { color: #777; font-size: 0.85rem; margin: 0; }
    button { margin-top: 1.25rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.45rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h2>Completing sign in...</h2>
    <p>This window will close automatically.</p>
    <button onclick="window.close()">Close window</button>
  </div>
  <script>
    const payload = { type: 'APPFLIX_OAUTH_SUCCESS', next: ${JSON.stringify(next)} };
    
    // 1. BroadcastChannel (Works across same-origin tabs/popups regardless of opener status)
    try {
      const bc = new BroadcastChannel('appflix_oauth_channel');
      bc.postMessage(payload);
      bc.close();
    } catch (e) {}

    // 2. LocalStorage event (Fallback for broad cross-window synchronization)
    try {
      localStorage.setItem('appflix_oauth_result', JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch (e) {}

    // 3. Window Opener postMessage (Direct if opener reference is intact)
    try {
      if (window.opener) {
        window.opener.postMessage(payload, ${JSON.stringify(origin)});
      }
    } catch (e) {}

    // 4. Immediately close this popup
    try {
      window.close();
    } catch (e) {}

    // Safety fallback: if running in a regular tab with no opener, redirect after delay
    setTimeout(() => {
      try { window.close(); } catch(e) {}
    }, 400);
  </script>
</body>
</html>`

      return new NextResponse(successHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    const failHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Error</title>
  <style>
    body { background: #080808; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; }
    h2 { color: #ff5555; font-size: 1.15rem; margin-bottom: 0.5rem; }
    p { color: #888; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Authentication Error</h2>
    <p>${error.message}</p>
  </div>
  <script>
    const payload = { type: 'APPFLIX_OAUTH_ERROR', error: ${JSON.stringify(error.message)} };
    try {
      const bc = new BroadcastChannel('appflix_oauth_channel');
      bc.postMessage(payload);
      bc.close();
    } catch (e) {}
    try {
      localStorage.setItem('appflix_oauth_result', JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch (e) {}
    try {
      if (window.opener) {
        window.opener.postMessage(payload, ${JSON.stringify(origin)});
      }
    } catch (e) {}
    setTimeout(() => {
      try { window.close(); } catch(e) {}
    }, 200);
  </script>
</body>
</html>`
    return new NextResponse(failHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed%20or%20missing%20code`)
}
