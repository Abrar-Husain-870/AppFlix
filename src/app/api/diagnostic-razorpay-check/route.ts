import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()

  if (!keyId || !keySecret) {
    return NextResponse.json({ result: 'KEYS_MISSING_IN_RUNTIME' }, { status: 200 })
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 7900,
        currency: 'INR',
        receipt: `rcpt_diagnostic_${Date.now()}`,
      }),
    })

    const razorpayBody = await razorpayRes.json().catch(() => ({ raw: 'non-json-response' }))

    // NEVER return auth headers or credentials — only status and Razorpay response body
    return NextResponse.json({
      http_status: razorpayRes.status,
      http_status_text: razorpayRes.statusText,
      razorpay_response: razorpayBody,
    })
  } catch (err: any) {
    return NextResponse.json({
      fetch_error: err.message || 'Unknown fetch error',
    }, { status: 200 })
  }
}
