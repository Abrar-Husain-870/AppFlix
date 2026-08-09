import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { applyPublicVisibilityFilter } from '../src/lib/supabase/public-queries.ts'
import { POST } from '../src/app/api/webhooks/razorpay/route.ts'
import { devSimulatePaymentSuccess } from '../src/app/actions/plus.ts'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function approveProjectForTest(projectId) {
  // 1. Try atomic database RPC
  const { data: rpcResult, error: rpcErr } = await supabase.rpc('approve_project_entitlement', { p_project_id: projectId })
  if (!rpcErr && rpcResult) return rpcResult

  // 2. Fallback to atomic conditional updates (matching admin.ts logic)
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).single()
  const now = new Date().toISOString()

  const { data: claimProfile } = await supabase
    .from('profiles')
    .update({ free_listing_used: true })
    .eq('id', project.user_id)
    .eq('free_listing_used', false)
    .select('id')

  if (claimProfile && claimProfile.length > 0) {
    await supabase.from('projects').update({ status: 'approved', approved_at: now, listing_type: 'free', listing_paid: true, listing_expires_at: null }).eq('id', projectId)
  } else {
    const { data: reusableSlots } = await supabase
      .from('listing_slots')
      .select('id, expires_at')
      .eq('user_id', project.user_id)
      .eq('status', 'paid')
      .gt('expires_at', now)
      .is('project_id', null)
      .order('expires_at', { ascending: true })
      .limit(1)

    const reusableSlot = reusableSlots?.[0]
    let claimedSlot = null
    if (reusableSlot) {
      const { data: slotRes } = await supabase
        .from('listing_slots')
        .update({ project_id: projectId })
        .eq('id', reusableSlot.id)
        .is('project_id', null)
        .select('id, expires_at')

      if (slotRes && slotRes.length > 0) claimedSlot = slotRes[0]
    }

    if (claimedSlot) {
      await supabase.from('projects').update({ status: 'approved', approved_at: now, listing_type: 'paid', listing_paid: true, listing_expires_at: claimedSlot.expires_at }).eq('id', projectId)
    } else {
      await supabase.from('projects').update({ status: 'approved', approved_at: now, listing_type: 'paid', listing_paid: false, listing_expires_at: null }).eq('id', projectId)
    }
  }
}

async function runRemediationTests() {
  console.log('============================================================')
  console.log('APPFLIX PLUS DEDICATED FIXTURE SECURITY REGRESSION SUITE')
  console.log('============================================================\n')

  let passed = 0
  let failed = 0
  let testUserId = null

  try {
    // 1. Create Dedicated Temporary Supabase Auth User
    const timestamp = Date.now()
    const testEmail = `test_fixture_${timestamp}@appflix-remediation.internal`
    const testUsername = `test_dev_${timestamp}`

    console.log(`[SETUP] Creating dedicated temporary Auth user: ${testEmail}...`)
    const { data: authResult, error: authErr } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: `TestPass_${timestamp}!`,
      email_confirm: true,
      user_metadata: { username: testUsername },
    })

    if (authErr || !authResult?.user) {
      throw new Error(`Failed to create temporary Auth user: ${authErr?.message}`)
    }

    testUserId = authResult.user.id
    console.log(`  ✅ Temporary Auth user created successfully. ID: ${testUserId}`)

    // Verify automatic trigger created corresponding profile row
    const { data: testProfile, error: profErr } = await supabase
      .from('profiles')
      .select('id, username, free_listing_used')
      .eq('id', testUserId)
      .single()

    if (profErr || !testProfile) {
      throw new Error(`Profile trigger did not create profile row for auth user ${testUserId}: ${profErr?.message}`)
    }

    console.log(`  ✅ Verified corresponding profiles row created automatically via DB trigger. Username: ${testProfile.username}, free_listing_used: ${testProfile.free_listing_used}`)

    const catId = (await supabase.from('categories').select('id').limit(1).single()).data.id

    // --- SUITE A: Concurrent Free Approvals ---
    try {
      console.log('\n[TEST A] Concurrent free-listing approvals...')

      // Insert 2 pending projects for the dedicated test user
      const { data: p1, error: e1 } = await supabase.from('projects').insert({
        user_id: testUserId,
        name: `Conc Free 1 ${timestamp}_A`,
        slug: `conc-free-1-${timestamp}-a`,
        tagline: 'Concurrent test tagline long enough',
        description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId,
        stage: 'production',
        platforms: ['web'],
        status: 'pending',
      }).select().single()

      const { data: p2, error: e2 } = await supabase.from('projects').insert({
        user_id: testUserId,
        name: `Conc Free 2 ${timestamp}_B`,
        slug: `conc-free-2-${timestamp}-b`,
        tagline: 'Concurrent test tagline long enough',
        description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId,
        stage: 'production',
        platforms: ['web'],
        status: 'pending',
      }).select().single()

      if (e1 || e2) throw new Error(`Project insertion failed: ${e1?.message || e2?.message}`)

      // Execute atomic approveProject concurrently
      await Promise.all([
        approveProjectForTest(p1.id),
        approveProjectForTest(p2.id),
      ])

      const { data: res1 } = await supabase.from('projects').select('listing_type, listing_paid').eq('id', p1.id).single()
      const { data: res2 } = await supabase.from('projects').select('listing_type, listing_paid').eq('id', p2.id).single()

      const freeCount = [res1, res2].filter(r => r.listing_type === 'free' && r.listing_paid === true).length
      const unpaidCount = [res1, res2].filter(r => r.listing_type === 'paid' && r.listing_paid === false).length

      if (freeCount === 1 && unpaidCount === 1) {
        console.log('  ✅ TEST A Passed: Concurrent approvals on new profile resulted in exactly 1 free listing and 1 unpaid project.')
        passed++
      } else {
        console.error(`  ❌ TEST A Failed: Free count = ${freeCount}, Unpaid count = ${unpaidCount}`)
        failed++
      }

      // Clean up Test A projects
      await supabase.from('projects').delete().in('id', [p1.id, p2.id])
    } catch (err) {
      console.error('  ❌ TEST A Error:', err.message)
      failed++
    }

    // --- SUITE B: Concurrent Reusable Slot Claims ---
    try {
      console.log('\n[TEST B] Concurrent reusable slot claims...')

      // Create 1 active reusable paid slot for test user
      const slotExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: slot, error: sErr } = await supabase.from('listing_slots').insert({
        user_id: testUserId,
        project_id: null,
        razorpay_order_id: `order_conc_slot_${timestamp}`,
        status: 'paid',
        expires_at: slotExpiry,
        amount_paise: 7900,
      }).select().single()

      if (sErr || !slot) throw new Error(`Slot insertion failed: ${sErr?.message}`)

      // Ensure test user free_listing_used is true
      await supabase.from('profiles').update({ free_listing_used: true }).eq('id', testUserId)

      // Insert 2 pending projects
      const { data: p1 } = await supabase.from('projects').insert({
        user_id: testUserId,
        name: `Conc Slot 1 ${timestamp}_A`,
        slug: `conc-slot-1-${timestamp}-a`,
        tagline: 'Slot test tagline long enough',
        description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId,
        stage: 'production',
        platforms: ['web'],
        status: 'pending',
      }).select().single()

      const { data: p2 } = await supabase.from('projects').insert({
        user_id: testUserId,
        name: `Conc Slot 2 ${timestamp}_B`,
        slug: `conc-slot-2-${timestamp}-b`,
        tagline: 'Slot test tagline long enough',
        description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId,
        stage: 'production',
        platforms: ['web'],
        status: 'pending',
      }).select().single()

      // Execute atomic approveProject concurrently
      await Promise.all([
        approveProjectForTest(p1.id),
        approveProjectForTest(p2.id),
      ])

      const { data: res1 } = await supabase.from('projects').select('listing_type, listing_paid, listing_expires_at').eq('id', p1.id).single()
      const { data: res2 } = await supabase.from('projects').select('listing_type, listing_paid, listing_expires_at').eq('id', p2.id).single()

      const claimedCount = [res1, res2].filter(r => r.listing_type === 'paid' && r.listing_paid === true).length
      const unpaidCount = [res1, res2].filter(r => r.listing_type === 'paid' && r.listing_paid === false).length

      if (claimedCount === 1 && unpaidCount === 1) {
        console.log('  ✅ TEST B Passed: Concurrent approval correctly assigned reusable slot to exactly 1 project.')
        passed++
      } else {
        console.error(`  ❌ TEST B Failed: Claimed count = ${claimedCount}, Unpaid count = ${unpaidCount}`)
        failed++
      }

      // Clean up Test B projects & slot
      await supabase.from('projects').delete().in('id', [p1.id, p2.id])
      await supabase.from('listing_slots').delete().eq('id', slot.id)
    } catch (err) {
      console.error('  ❌ TEST B Error:', err.message)
      failed++
    }

    // --- SUITE C: Production Simulator Guard ---
    try {
      console.log('\n[TEST C] Production simulator invocation guard...')
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      let rejected = false
      try {
        await devSimulatePaymentSuccess('mock_order_id')
      } catch (err) {
        rejected = err.message.includes('production environment')
      }

      process.env.NODE_ENV = originalEnv

      if (rejected) {
        console.log('  ✅ TEST C Passed: devSimulatePaymentSuccess immediately rejected execution in production environment.')
        passed++
      } else {
        console.error('  ❌ TEST C Failed: devSimulatePaymentSuccess was NOT rejected in production environment.')
        failed++
      }
    } catch (err) {
      console.error('  ❌ TEST C Error:', err.message)
      failed++
    }

    // --- SUITE D: Webhook Missing Secret Guard (Fail Closed) ---
    try {
      console.log('\n[TEST D] Webhook missing secret fail-closed guard...')
      const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET
      const originalEnv = process.env.NODE_ENV

      process.env.NODE_ENV = 'production'
      delete process.env.RAZORPAY_WEBHOOK_SECRET

      const dummyReq = {
        text: async () => JSON.stringify({ event: 'payment.captured' }),
        headers: { get: () => null },
      }

      const res = await POST(dummyReq)
      process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret
      process.env.NODE_ENV = originalEnv

      if (res.status === 500) {
        console.log('  ✅ TEST D Passed: Webhook failed closed with HTTP 500 when secret was missing in production.')
        passed++
      } else {
        console.error(`  ❌ TEST D Failed: Expected HTTP 500, got HTTP ${res.status}`)
        failed++
      }
    } catch (err) {
      console.error('  ❌ TEST D Error:', err.message)
      failed++
    }

    // --- SUITE E & F: Public Visibility 4-State Matrix ---
    try {
      console.log('\n[TEST E & F] Public visibility 4-state matrix & entry points...')

      // 1. Free Approved Project
      const { data: freeProj } = await supabase.from('projects').insert({
        user_id: testUserId, name: `Vis Free ${timestamp}`, slug: `vis-free-${timestamp}`,
        tagline: 'Vis free tagline long enough', description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId, stage: 'production', platforms: ['web'], status: 'approved',
        listing_type: 'free', listing_paid: true, listing_expires_at: null,
      }).select().single()

      // 2. Active Paid Approved Project
      const activeExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: activePaidProj } = await supabase.from('projects').insert({
        user_id: testUserId, name: `Vis Active Paid ${timestamp}`, slug: `vis-active-paid-${timestamp}`,
        tagline: 'Vis active paid tagline long enough', description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId, stage: 'production', platforms: ['web'], status: 'approved',
        listing_type: 'paid', listing_paid: true, listing_expires_at: activeExpiry,
      }).select().single()

      // 3. Unpaid Approved Project
      const { data: unpaidProj } = await supabase.from('projects').insert({
        user_id: testUserId, name: `Vis Unpaid ${timestamp}`, slug: `vis-unpaid-${timestamp}`,
        tagline: 'Vis unpaid tagline long enough', description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId, stage: 'production', platforms: ['web'], status: 'approved',
        listing_type: 'paid', listing_paid: false, listing_expires_at: null,
      }).select().single()

      // 4. Expired Paid Approved Project
      const expiredExpiry = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      const { data: expiredPaidProj } = await supabase.from('projects').insert({
        user_id: testUserId, name: `Vis Expired Paid ${timestamp}`, slug: `vis-expired-paid-${timestamp}`,
        tagline: 'Vis expired paid tagline long enough', description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
        category_id: catId, stage: 'production', platforms: ['web'], status: 'approved',
        listing_type: 'paid', listing_paid: true, listing_expires_at: expiredExpiry,
      }).select().single()

      // Run public visibility query via applyPublicVisibilityFilter
      const baseQuery = supabase.from('projects').select('id').in('id', [freeProj.id, activePaidProj.id, unpaidProj.id, expiredPaidProj.id])
      const { data: visibleProjects } = await applyPublicVisibilityFilter(baseQuery)
      const visibleIds = (visibleProjects ?? []).map(p => p.id)

      const freeVisible = visibleIds.includes(freeProj.id)
      const activePaidVisible = visibleIds.includes(activePaidProj.id)
      const unpaidHidden = !visibleIds.includes(unpaidProj.id)
      const expiredPaidHidden = !visibleIds.includes(expiredPaidProj.id)

      if (freeVisible && activePaidVisible && unpaidHidden && expiredPaidHidden) {
        console.log('  ✅ TEST E & F Passed: Public visibility 4-state matrix verified (Free: VISIBLE, Active Paid: VISIBLE, Unpaid: HIDDEN, Expired: HIDDEN).')
        passed++
      } else {
        console.error(`  ❌ TEST E & F Failed: Free=${freeVisible}, ActivePaid=${activePaidVisible}, UnpaidHidden=${unpaidHidden}, ExpiredHidden=${expiredPaidHidden}`)
        failed++
      }

      // Cleanup Test E projects
      await supabase.from('projects').delete().in('id', [freeProj.id, activePaidProj.id, unpaidProj.id, expiredPaidProj.id])
    } catch (err) {
      console.error('  ❌ TEST E & F Error:', err.message)
      failed++
    }

  } finally {
    if (testUserId) {
      console.log(`\n[CLEANUP] Deleting dedicated temporary Auth user ${testUserId}...`)
      // Delete Auth user via admin API — cascades to profiles row and any remaining test projects/slots
      const { error: delErr } = await supabase.auth.admin.deleteUser(testUserId)
      if (delErr) {
        console.error(`  ❌ Cleanup error: Failed to delete auth user ${testUserId}: ${delErr.message}`)
      } else {
        console.log(`  ✅ Successfully deleted temporary Auth user ${testUserId} and cascaded profile cleanup.`)
      }
    }
  }

  console.log('\n============================================================')
  console.log(`REMEDIATION SUITE SUMMARY: ${passed} passed, ${failed} failed`)
  console.log('============================================================')
}

runRemediationTests()
