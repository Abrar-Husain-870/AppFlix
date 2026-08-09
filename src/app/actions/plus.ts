'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ListingStatus {
  free_listing_used: boolean
  active_slots_count: number
  unpaid_projects: Array<{
    id: string
    name: string
    slug: string
  }>
}

export async function getUserListingStatus(): Promise<ListingStatus> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const now = new Date().toISOString()

  const [profileRes, slotsRes, projectsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('free_listing_used')
      .eq('id', user.id)
      .single(),
    supabase
      .from('listing_slots')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .gt('expires_at', now),
    supabase
      .from('projects')
      .select('id, name, slug')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('listing_type', 'paid')
      .eq('listing_paid', false)
      .is('deleted_at', null),
  ])

  return {
    free_listing_used: profileRes.data?.free_listing_used ?? false,
    active_slots_count: slotsRes.data?.length ?? 0,
    unpaid_projects: projectsRes.data ?? [],
  }
}

export interface RazorpayOrderResponse {
  order_id: string
  key_id: string
  amount: number
  currency: string
  project_id: string
}

export async function createListingOrder(projectId: string): Promise<RazorpayOrderResponse> {
  const supabase = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Verify project ownership
  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('id, name, user_id, status, listing_type, listing_paid')
    .eq('id', projectId)
    .single()

  if (pErr || !project || project.user_id !== user.id) {
    throw new Error('Project not found or unauthorized')
  }

  if (project.status !== 'approved') {
    throw new Error('Payment can only be made for approved projects')
  }

  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()

  // Dev fallback / mock if Razorpay keys are not yet configured in .env.local
  if (!keyId || !keySecret) {
    console.warn('[createListingOrder] Razorpay API keys not configured. Generating test mock order.')
    const mockOrderId = `order_mock_${Date.now()}`

    // Insert pending slot in DB
    const { error: slotErr } = await supabaseService
      .from('listing_slots')
      .insert({
        user_id: user.id,
        project_id: projectId,
        razorpay_order_id: mockOrderId,
        amount_paise: 7900,
        status: 'pending',
      })

    if (slotErr) console.error('[createListingOrder mock insert error]', slotErr)

    return {
      order_id: mockOrderId,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key',
      amount: 7900,
      currency: 'INR',
      project_id: projectId,
    }
  }

  // Create real Razorpay order via REST API
  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  
  const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 7900, // ₹79 in paise
      currency: 'INR',
      receipt: `rcpt_${projectId.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        project_id: projectId,
      },
    }),
  })

  if (!razorpayRes.ok) {
    const errText = await razorpayRes.text()
    console.error('[Razorpay Order Creation Failed]', errText)
    throw new Error('Failed to create payment order with Razorpay')
  }

  const razorpayOrder = await razorpayRes.json()

  // Store pending order in listing_slots
  const { error: slotInsertErr } = await supabaseService
    .from('listing_slots')
    .insert({
      user_id: user.id,
      project_id: projectId,
      razorpay_order_id: razorpayOrder.id,
      amount_paise: 7900,
      status: 'pending',
    })

  if (slotInsertErr) {
    console.error('[createListingOrder slot insert error]', slotInsertErr)
    throw new Error('Failed to initialize payment record')
  }

  return {
    order_id: razorpayOrder.id,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
    amount: 7900,
    currency: 'INR',
    project_id: projectId,
  }
}

/**
 * Dev utility action: Manually confirm payment for testing when webhooks/ngrok are absent.
 */
export async function devSimulatePaymentSuccess(orderId: string) {
  const supabaseService = await createServiceRoleClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

  // Find slot
  const { data: slot } = await supabaseService
    .from('listing_slots')
    .select('id, user_id, project_id, status')
    .eq('razorpay_order_id', orderId)
    .single()

  if (!slot) throw new Error('Slot order not found')

  const mockPaymentId = `pay_mock_${Date.now()}`
  const mockEventId = `evt_mock_${Date.now()}`

  // Update slot to paid
  await supabaseService
    .from('listing_slots')
    .update({
      status: 'paid',
      expires_at: expiresAt,
      razorpay_payment_id: mockPaymentId,
      razorpay_event_id: mockEventId,
    })
    .eq('id', slot.id)

  // Update project to paid & active
  if (slot.project_id) {
    await supabaseService
      .from('projects')
      .update({
        listing_paid: true,
        listing_expires_at: expiresAt,
      })
      .eq('id', slot.project_id)
  }

  revalidatePath('/browse')
  revalidatePath('/dashboard/projects')
  return { success: true, expires_at: expiresAt }
}
