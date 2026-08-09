import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, any> = {
    supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ? 'PRESENT' : 'MISSING',
    next_public_supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ? 'PRESENT' : 'MISSING',
  }

  try {
    const supabaseService = await createServiceRoleClient()

    // Test 1: Can we reach Supabase at all with the service role key?
    const { data: pingData, error: pingErr } = await supabaseService
      .from('listing_slots')
      .select('id')
      .limit(1)

    results.listing_slots_select = pingErr
      ? { error_code: pingErr.code, error_message: pingErr.message }
      : 'SUCCESS'

    // Test 2: Can we insert a safe diagnostic test row?
    // Use a fake UUID that won't clash with real data
    const testOrderId = `diag_test_${Date.now()}`
    const testUserId = '00000000-0000-0000-0000-000000000000' // non-existent user

    const { error: insertErr } = await supabaseService
      .from('listing_slots')
      .insert({
        user_id: testUserId,
        project_id: null,
        razorpay_order_id: testOrderId,
        amount_paise: 7900,
        status: 'pending',
      })

    // We expect this to fail due to FK constraint (user doesn't exist)
    // BUT the error code tells us WHERE the failure is:
    // - 23503 = FK violation (service role is working, table is reachable, FK is the issue)
    // - 42501 = permission denied (service role key is wrong)
    // - 42P01 = table doesn't exist
    results.listing_slots_insert_test = insertErr
      ? { error_code: insertErr.code, error_message: insertErr.message }
      : 'SUCCESS_UNEXPECTED'

  } catch (err: any) {
    results.exception = err.message || 'Unknown error'
  }

  return NextResponse.json(results)
}
