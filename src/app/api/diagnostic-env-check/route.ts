import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim()
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
  const nextPublicRazorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()
  const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
  const nodeEnv = process.env.NODE_ENV

  return NextResponse.json({
    RAZORPAY_KEY_ID: razorpayKeyId ? 'PRESENT' : 'MISSING',
    RAZORPAY_KEY_SECRET: razorpayKeySecret ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: nextPublicRazorpayKeyId ? 'PRESENT' : 'MISSING',
    RAZORPAY_WEBHOOK_SECRET: razorpayWebhookSecret ? 'PRESENT' : 'MISSING',
    NODE_ENV: nodeEnv || 'UNKNOWN',
  })
}
