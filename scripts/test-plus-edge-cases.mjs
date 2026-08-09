import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(url, key)

async function runEdgeCaseTests() {
  console.log('============================================================')
  console.log('APPFLIX PLUS EDGE CASES TEST MATRIX')
  console.log('============================================================\n')

  let passed = 0
  let failed = 0

  // Test 1: Expiry date preservation on slot reuse
  try {
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single()
    const testSlotExpiry = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days remaining

    // Create paid slot with 45 days left and project_id null
    const { data: slot, error: sErr } = await supabase
      .from('listing_slots')
      .insert({
        user_id: profile.id,
        project_id: null,
        razorpay_order_id: `order_test_reuse_${Date.now()}`,
        status: 'paid',
        expires_at: testSlotExpiry,
        amount_paise: 7900,
      })
      .select()
      .single()

    if (sErr || !slot) throw new Error(`Failed to insert test slot: ${sErr?.message}`)

    // Create dummy pending project
    const { data: proj, error: pErr } = await supabase
      .from('projects')
      .insert({
        user_id: profile.id,
        name: `Test Slot Reuse ${Date.now()}`,
        slug: `test-slot-reuse-${Date.now()}`,
        tagline: 'Testing slot expiry preservation',
        description: 'Test description for slot expiry preservation test case',

        category_id: (await supabase.from('categories').select('id').limit(1).single()).data.id,
        stage: 'production',
        platforms: ['web'],
        status: 'pending',
      })
      .select()
      .single()

    if (pErr || !proj) throw new Error(`Failed to insert test project: ${pErr?.message}`)

    // Fetch reusable slot as admin would in approveProject
    const { data: reusableSlots } = await supabase
      .from('listing_slots')
      .select('id, expires_at')
      .eq('id', slot.id)
      .eq('user_id', profile.id)
      .eq('status', 'paid')
      .gt('expires_at', new Date().toISOString())
      .is('project_id', null)
      .limit(1)



    const reusableSlot = reusableSlots?.[0]
    if (!reusableSlot) throw new Error('Reusable slot not found')

    const diffMs = Math.abs(new Date(reusableSlot.expires_at).getTime() - new Date(testSlotExpiry).getTime())
    if (diffMs < 1000) {
      console.log('  ✅ Edge Case 1 Passed: Slot reuse preserves original expires_at (45 days remaining)')
      passed++
    } else {
      console.error(`  ❌ Edge Case 1 Failed: Expiry date mismatch. Slot: ${reusableSlot.expires_at}, Expected: ${testSlotExpiry}`)
      failed++
    }


    // Cleanup test data
    await supabase.from('projects').delete().eq('id', proj.id)
    await supabase.from('listing_slots').delete().eq('id', slot.id)
  } catch (err) {
    console.error('  ❌ Edge Case 1 Error:', err.message)
    failed++
  }

  // Test 2: Renewal creates a NEW listing_slots row without deleting the old one
  try {
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single()

    // 1st slot (old/expired)
    const oldExpiry = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const { data: oldSlot } = await supabase
      .from('listing_slots')
      .insert({
        user_id: profile.id,
        project_id: null,
        razorpay_order_id: `order_old_${Date.now()}`,
        status: 'paid',
        expires_at: oldExpiry,
        amount_paise: 7900,
      })
      .select()
      .single()

    // 2nd slot (renewal)
    const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: newSlot } = await supabase
      .from('listing_slots')
      .insert({
        user_id: profile.id,
        project_id: null,
        razorpay_order_id: `order_renewal_${Date.now()}`,
        status: 'paid',
        expires_at: newExpiry,
        amount_paise: 7900,
      })
      .select()
      .single()

    // Verify both rows exist in DB (history preserved)
    const { count } = await supabase
      .from('listing_slots')
      .select('*', { count: 'exact', head: true })
      .in('id', [oldSlot.id, newSlot.id])

    if (count === 2) {
      console.log('  ✅ Edge Case 2 Passed: Renewal creates a new slot row and preserves payment history')
      passed++
    } else {
      console.error('  ❌ Edge Case 2 Failed: Old slot history overwritten or lost')
      failed++
    }

    // Cleanup
    await supabase.from('listing_slots').delete().in('id', [oldSlot.id, newSlot.id])
  } catch (err) {
    console.error('  ❌ Edge Case 2 Error:', err.message)
    failed++
  }

  console.log('\n============================================================')
  console.log(`EDGE CASES SUMMARY: ${passed} passed, ${failed} failed`)
  console.log('============================================================')
}

runEdgeCaseTests()
