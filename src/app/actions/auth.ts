'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type AuthState = {
  error?: string
  message?: string
} | undefined

export async function signIn(state: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/?justLoggedIn=true')
}

export async function signUp(state: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Ensure active session if Supabase didn't auto-establish session
  if (!data?.session) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) {
      return { error: signInErr.message }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/?justLoggedIn=true')
}

export async function requestPasswordReset(state: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  if (!email) {
    return { error: 'Please enter your email address.' }
  }

  const supabase = await createServerClient()
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    const errorMsg = typeof error.message === 'string' && error.message.trim() !== '{}' && error.message.trim() !== ''
      ? error.message
      : 'Failed to send reset link. Please check your SMTP configuration in Supabase.'
    return { error: errorMsg }
  }

  return { message: 'Password reset link sent to your email! Please check your inbox.' }
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
