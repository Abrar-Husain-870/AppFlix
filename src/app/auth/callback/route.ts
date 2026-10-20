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
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(providerError)}`)
  }

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed%20or%20missing%20code`)
}
