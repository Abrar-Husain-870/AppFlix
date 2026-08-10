'use client'

import { useState, useTransition } from 'react'
import { createListingOrder, devSimulatePaymentSuccess } from '@/app/actions/plus'
import { CreditCard, Loader2, CheckCircle, Sparkles } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PlusPaymentButton({
  projectId,
  projectName,
  isExpired = false,
}: {
  projectId: string
  projectName: string
  isExpired?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setMessage(null)

    try {
      const order = await createListingOrder(projectId)

      // If Razorpay.js is available on window, open official modal
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'AppFlix Plus',
          description: `90-day Public Listing for ${projectName}`,
          order_id: order.order_id,
          handler: function (response: any) {
            startTransition(async () => {
              setMessage('Payment completed! Verifying entitlement...')
              window.location.reload()
            })
          },
          prefill: {},
          theme: {
            color: '#E50914',
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        setLoading(false)
        return
      }

      // If Razorpay SDK is unavailable in production, NEVER call devSimulatePaymentSuccess
      if (process.env.NODE_ENV === 'production') {
        console.error('[PlusPaymentButton] Razorpay Checkout SDK (window.Razorpay) unavailable in production environment.')
        setMessage('Payment gateway could not be loaded. Please refresh the page and try again.')
        setLoading(false)
        return
      }

      // Dev fallback: ONLY available when NODE_ENV === 'development'
      if (process.env.NODE_ENV === 'development') {
        const result = await devSimulatePaymentSuccess(order.order_id)
        if (result.success) {
          setMessage('Payment successful! 90-day listing activated.')
          startTransition(() => {
            window.location.reload()
          })
        }
      }
    } catch (err: any) {
      console.error('[PlusPaymentButton error]', err)
      setMessage(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        onClick={handlePay}
        disabled={loading || isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 0.85rem',
          background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '0.78rem',
          borderRadius: '0.4rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(229, 9, 20, 0.3)',
          transition: 'all 0.15s ease',
        }}
      >
        {loading || isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <CreditCard size={13} />
        )}
        {isExpired ? 'Renew ₹1 (90 days)' : 'Pay ₹1 to Publish'}
      </button>
      {message && (
        <span style={{ fontSize: '0.7rem', color: '#2ECC71', fontWeight: 600 }}>
          {message}
        </span>
      )}
    </div>
  )
}

