'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

export async function submitContactInquiry(formData: {
  name?: string
  email: string
  message: string
}) {
  try {
    const supabase = await createServiceRoleClient()
    const name = formData.name?.trim() || 'AppFlix Visitor'
    const email = formData.email.trim()
    const message = formData.message.trim()

    // 1. Save inquiry into Supabase DB table `support_inquiries`
    try {
      await supabase
        .from('support_inquiries')
        .insert({
          name,
          email,
          message,
          recipient_email: 'husainabrar870@gmail.com',
          status: 'unread',
        })
    } catch (dbErr) {
      console.warn('DB log notice:', dbErr)
    }

    // 2. Dispatch email notification using FormSubmit Secure Hashed Token (b107a8b204a0eb824a0f9bf06b3a9f44)
    try {
      const params = new URLSearchParams()
      params.append('name', name)
      params.append('email', email)
      params.append('message', message)
      params.append('_subject', `📥 New AppFlix Query from ${email}`)
      params.append('_template', 'table')
      params.append('_captcha', 'false')

      await fetch('https://formsubmit.co/ajax/b107a8b204a0eb824a0f9bf06b3a9f44', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'http://localhost:3000',
        },
        body: params.toString(),
      })
    } catch (fsErr) {
      console.error('FormSubmit dispatch error:', fsErr)
    }

    // 3. Backup dispatch via Web3Forms API
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: '4b8c6628-9844-42b7-a3f2-efef88d928bb',
          to_email: 'husainabrar870@gmail.com',
          subject: `📥 New AppFlix Query from ${email}`,
          from_name: name,
          email: email,
          message: message,
        }),
      })
    } catch (web3Err) {
      console.error('Web3Forms dispatch error:', web3Err)
    }

    return { success: true }
  } catch (err: any) {
    console.error('Failed to submit contact inquiry:', err)
    return { success: false, error: err.message || 'Failed to submit inquiry' }
  }
}
