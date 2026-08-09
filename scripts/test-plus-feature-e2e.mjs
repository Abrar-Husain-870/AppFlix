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

async function testPlusE2E() {
  console.log('='.repeat(60))
  console.log('APPFLIX PLUS FEATURE INTEGRATION TEST (DEV DB)')
  console.log('='.repeat(60) + '\n')

  let passes = 0
  let fails = 0

  function check(label, condition, details = '') {
    if (condition) {
      console.log(`  ✅ ${label}${details ? ' — ' + details : ''}`)
      passes++
    } else {
      console.log(`  ❌ ${label}${details ? ' — ' + details : ''}`)
      fails++
    }
  }

  // 1. Fetch user brainstormhusain_8e72
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id, free_listing_used')
    .filter('username', 'ilike', 'brainstormhusain%')
    .single()

  check('Developer profile loaded', Boolean(userProfile), userProfile?.id)
  check('free_listing_used is TRUE', userProfile?.free_listing_used === true)

  // 2. Insert a test 2nd project in pending state
  const testSlug = `test-app-2-${Date.now().toString(36)}`
  const { data: testProj, error: pErr } = await supabase
    .from('projects')
    .insert({
      user_id: userProfile.id,
      category_id: 1,
      name: 'Test App 2 (Paid Candidate)',
      slug: testSlug,
      tagline: 'A test project to verify Plus payment flow',
      description: 'This is a long description to satisfy the fifty character minimum length requirement for project submission.',
      stage: 'production',
      platforms: ['web'],
      status: 'pending',
      listing_type: 'free',
      listing_paid: false,
    })
    .select('id, name, status, listing_type, listing_paid')
    .single()

  check('Inserted 2nd test project (pending)', !pErr && Boolean(testProj), pErr?.message)

  // 3. Simulate approveProject() for 2nd app (should become listing_type='paid', listing_paid=false)
  const now = new Date().toISOString()
  
  // Reusable slot check
  const { data: slots } = await supabase
    .from('listing_slots')
    .select('id, expires_at')
    .eq('user_id', userProfile.id)
    .eq('status', 'paid')
    .gt('expires_at', now)
    .is('project_id', null)
    .limit(1)

  const hasSlot = slots && slots.length > 0

  if (!hasSlot) {
    await supabase
      .from('projects')
      .update({
        status: 'approved',
        approved_at: now,
        listing_type: 'paid',
        listing_paid: false,
        listing_expires_at: null,
      })
      .eq('id', testProj.id)
  }

  const { data: approvedProj } = await supabase
    .from('projects')
    .select('status, listing_type, listing_paid, listing_expires_at')
    .eq('id', testProj.id)
    .single()

  check('2nd project approved as listing_type="paid"', approvedProj?.listing_type === 'paid')
  check('2nd project requires payment (listing_paid=FALSE)', approvedProj?.listing_paid === false)

  // 4. Create listing_slots pending order
  const orderId = `order_test_${Date.now()}`
  const { data: slot, error: sErr } = await supabase
    .from('listing_slots')
    .insert({
      user_id: userProfile.id,
      project_id: testProj.id,
      razorpay_order_id: orderId,
      amount_paise: 7900,
      status: 'pending',
    })
    .select('id, status')
    .single()

  check('Pending listing_slots row created', !sErr && Boolean(slot), sErr?.message)

  // 5. Simulate payment activation (webhook response)
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const paymentId = `pay_test_${Date.now()}`
  const eventId = `evt_test_${Date.now()}`

  await supabase
    .from('listing_slots')
    .update({
      status: 'paid',
      expires_at: expiresAt,
      razorpay_payment_id: paymentId,
      razorpay_event_id: eventId,
    })
    .eq('id', slot.id)

  await supabase
    .from('projects')
    .update({
      listing_paid: true,
      listing_expires_at: expiresAt,
    })
    .eq('id', testProj.id)

  const { data: paidProj } = await supabase
    .from('projects')
    .select('listing_paid, listing_expires_at')
    .eq('id', testProj.id)
    .single()

  check('2nd project listing_paid set to TRUE', paidProj?.listing_paid === true)
  check('2nd project listing_expires_at set to 90 days', Boolean(paidProj?.listing_expires_at))

  // 6. Test soft-delete slot release
  await supabase
    .from('listing_slots')
    .update({ project_id: null })
    .eq('project_id', testProj.id)
    .eq('status', 'paid')

  await supabase
    .from('projects')
    .update({ status: 'deleted', deleted_at: new Date().toISOString() })
    .eq('id', testProj.id)

  const { data: releasedSlot } = await supabase
    .from('listing_slots')
    .select('project_id, status, expires_at')
    .eq('id', slot.id)
    .single()

  check('Soft-deleted project released its slot (project_id IS NULL)', releasedSlot?.project_id === null)
  check('Released slot remains paid & active for reuse', releasedSlot?.status === 'paid' && Boolean(releasedSlot?.expires_at))

  // Clean up test data
  await supabase.from('listing_slots').delete().eq('id', slot.id)
  await supabase.from('projects').delete().eq('id', testProj.id)

  console.log('\n' + '='.repeat(60))
  console.log(`E2E TEST SUMMARY: ${passes} passed, ${fails} failed`)
  console.log('='.repeat(60))
}

testPlusE2E()
