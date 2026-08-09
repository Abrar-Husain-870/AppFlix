import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const eventId = req.headers.get('x-razorpay-event-id')

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()

    // 1. Signature Verification (Fail closed in production if secret is missing)
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[Razorpay Webhook FATAL] RAZORPAY_WEBHOOK_SECRET is missing in production environment.')
        return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 })
      }
      console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not set in environment. Skipping signature check in dev.')
    } else {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
      }
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (expectedSignature !== signature) {
        console.error('[Razorpay Webhook] Invalid signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }


    const payload = JSON.parse(rawBody)
    const supabaseService = await createServiceRoleClient()

    // 2. Event-level Idempotency Check
    if (eventId) {
      const { data: existingEvent } = await supabaseService
        .from('listing_slots')
        .select('id')
        .eq('razorpay_event_id', eventId)
        .maybeSingle()

      if (existingEvent) {
        console.log(`[Razorpay Webhook] Event ID ${eventId} already processed. Returning 200 OK.`)
        return NextResponse.json({ message: 'Event already processed' }, { status: 200 })
      }
    }

    // 3. Event Type Check
    if (payload.event !== 'payment.captured') {
      return NextResponse.json({ message: `Ignored event type: ${payload.event}` }, { status: 200 })
    }

    const paymentEntity = payload.payload?.payment?.entity
    if (!paymentEntity) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
    }

    const {
      id: paymentId,
      order_id: orderId,
      amount,
      currency,
      status: paymentStatus,
      notes,
    } = paymentEntity

    // 4. Currency Validation
    if (currency !== 'INR') {
      console.error(`[Razorpay Webhook] Invalid currency: ${currency}`)
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    // 5. Amount Validation (7900 paise = ₹79)
    if (amount !== 7900) {
      console.error(`[Razorpay Webhook] Invalid amount: ${amount}`)
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    // 6. Payment Status Validation
    if (paymentStatus !== 'captured') {
      console.error(`[Razorpay Webhook] Payment not captured: ${paymentStatus}`)
      return NextResponse.json({ message: 'Payment status not captured' }, { status: 200 })
    }

    // 7. Order Match & Fetch Pending Slot
    const { data: slot, error: slotErr } = await supabaseService
      .from('listing_slots')
      .select('id, user_id, project_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()

    if (slotErr || !slot) {
      console.error(`[Razorpay Webhook] No matching order found for order_id: ${orderId}`)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (slot.status === 'paid') {
      console.log(`[Razorpay Webhook] Slot order ${orderId} already paid. Returning 200 OK.`)
      return NextResponse.json({ message: 'Slot already activated' }, { status: 200 })
    }

    // 8. User Ownership Match
    const noteUserId = notes?.user_id
    if (noteUserId && noteUserId !== slot.user_id) {
      console.error(`[Razorpay Webhook] Mismatched user_id. Slot: ${slot.user_id}, Note: ${noteUserId}`)
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 })
    }

    // 9. Payment ID Uniqueness Check
    const { data: existingPayment } = await supabaseService
      .from('listing_slots')
      .select('id')
      .eq('razorpay_payment_id', paymentId)
      .maybeSingle()

    if (existingPayment) {
      console.log(`[Razorpay Webhook] Payment ID ${paymentId} already processed. Returning 200 OK.`)
      return NextResponse.json({ message: 'Payment ID already processed' }, { status: 200 })
    }

    // Activate Entitlement: Calculate 90 days from NOW
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

    // Update listing_slots
    const { error: slotUpdateErr } = await supabaseService
      .from('listing_slots')
      .update({
        status: 'paid',
        expires_at: expiresAt,
        razorpay_payment_id: paymentId,
        razorpay_event_id: eventId || `evt_${Date.now()}`,
      })
      .eq('id', slot.id)

    if (slotUpdateErr) {
      console.error('[Razorpay Webhook] Failed to update listing_slots:', slotUpdateErr)
      return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
    }

    // Update project listing state
    if (slot.project_id) {
      const { error: projUpdateErr } = await supabaseService
        .from('projects')
        .update({
          listing_type: 'paid',
          listing_paid: true,
          listing_expires_at: expiresAt,
        })
        .eq('id', slot.project_id)

      if (projUpdateErr) {
        console.error('[Razorpay Webhook] Failed to update project listing state:', projUpdateErr)
      }
    }

    console.log(`[Razorpay Webhook] Entitlement successfully activated for project ${slot.project_id}. Expires: ${expiresAt}`)
    return NextResponse.json({ success: true, expires_at: expiresAt }, { status: 200 })
  } catch (err: any) {
    console.error('[Razorpay Webhook Exception]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
