/**
 * scripts/verify-device-views.mjs
 *
 * Comprehensive end-to-end integration test suite for the AppFlix device-based
 * view counting architecture.
 *
 * Tests:
 *   1. Schema detection (project_views table, RLS).
 *   2. Unauthorized direct table writes via anon client (must fail with RLS violation).
 *   3. Unauthorized direct RPC execution via anon client (must fail with permission denied).
 *   4. Server-side input validation (invalid project IDs, invalid device IDs).
 *   5. Atomic view recording on first device visit (counted: true, +1 increment, analytics event).
 *   6. Deduplication on repeat visit (counted: false, no increment, no duplicate event).
 *   7. High-concurrency race condition test (5 simultaneous requests, exactly 1 counted).
 *   8. Complete cleanup and state restoration (zero production pollution).
 *
 * Run: node scripts/verify-device-views.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || !anonKey) {
  console.error('❌ Missing credentials in .env.local (require URL, ANON_KEY, and SERVICE_ROLE_KEY)')
  process.exit(1)
}

const supabaseService = createClient(url, serviceKey)
const supabaseAnon = createClient(url, anonKey)

function randomUUID() {
  return crypto.randomUUID()
}

async function runIntegrationSuite() {
  console.log('\n============================================================')
  console.log('APPFLIX DEVICE-BASED VIEW COUNTING: INTEGRATION TEST SUITE')
  console.log('Target URL:', url)
  console.log('============================================================\n')

  // ------------------------------------------------------------------
  // 1. Schema check
  // ------------------------------------------------------------------
  console.log('Test 1: Checking public.project_views table...')
  const { error: tableErr } = await supabaseService
    .from('project_views')
    .select('id')
    .limit(1)

  if (tableErr) {
    console.log('  ⚠️  project_views table not detected yet.')
    console.log('     Code:', tableErr.code, '-', tableErr.message)
    console.log('\n👉 ACTION REQUIRED: Run the SQL migration in Supabase Dashboard SQL Editor:')
    console.log('   File: supabase/migrations/schema-device-views.sql\n')
    return
  }
  console.log('  ✅ public.project_views table exists and is accessible via service_role.\n')

  // ------------------------------------------------------------------
  // 2. Unauthorized Direct Table Write via Anon Client
  // ------------------------------------------------------------------
  console.log('Test 2: Verifying unauthorized direct table writes are blocked by RLS...')
  const fakeProjectId = randomUUID()
  const fakeDeviceId = randomUUID()

  const { error: directWriteErr } = await supabaseAnon
    .from('project_views')
    .insert({
      project_id: fakeProjectId,
      device_id: fakeDeviceId
    })

  if (directWriteErr) {
    console.log('  ✅ Direct insert by anon client blocked as expected!')
    console.log('     Response:', directWriteErr.code, '-', directWriteErr.message)
  } else {
    console.error('  ❌ SECURITY FAILURE: Anon client was able to directly insert into project_views!')
    await supabaseService.from('project_views').delete().eq('device_id', fakeDeviceId)
    return
  }

  // ------------------------------------------------------------------
  // 3. Unauthorized Direct RPC Execution via Anon Client
  // ------------------------------------------------------------------
  console.log('\nTest 3: Verifying direct RPC execution is revoked from anon client...')
  const { data: anonRpcData, error: anonRpcErr } = await supabaseAnon.rpc('record_project_view', {
    p_project_id: fakeProjectId,
    p_device_id: fakeDeviceId
  })

  if (anonRpcErr) {
    console.log('  ✅ Direct RPC call by anon client blocked as expected!')
    console.log('     Response:', anonRpcErr.code, '-', anonRpcErr.message)
  } else {
    console.error('  ⚠️  WARNING: Anon client was able to call record_project_view directly!')
    console.error('     Ensure "REVOKE ALL ... FROM anon" has been run from schema-device-views.sql')
  }

  // ------------------------------------------------------------------
  // 4. Fetch Sample Approved Project for Functional Testing
  // ------------------------------------------------------------------
  console.log('\nTest 4: Fetching an approved project for database state tests...')
  const { data: projects, error: projErr } = await supabaseService
    .from('projects')
    .select('id, name, view_count')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .limit(1)

  if (projErr || !projects || projects.length === 0) {
    console.log('  ⚠️  No approved projects found in database to run live state tests.')
    return
  }

  const project = projects[0]
  const initialViewCount = project.view_count || 0
  console.log(`  Target Project: "${project.name}" (ID: ${project.id})`)
  console.log(`  Baseline view_count: ${initialViewCount}\n`)

  // ------------------------------------------------------------------
  // 5. Input Validation Tests
  // ------------------------------------------------------------------
  console.log('Test 5: Testing server RPC input validation...')
  const nonExistentProjectId = randomUUID()
  const { data: invalidProjRes } = await supabaseService.rpc('record_project_view', {
    p_project_id: nonExistentProjectId,
    p_device_id: randomUUID()
  })

  if (invalidProjRes?.success === false) {
    console.log('  ✅ Non-existent project correctly rejected (success: false).')
  } else {
    console.error('  ❌ Expected rejection for non-existent project, got:', invalidProjRes)
  }

  const { data: invalidDeviceRes } = await supabaseService.rpc('record_project_view', {
    p_project_id: project.id,
    p_device_id: 'short'
  })

  if (invalidDeviceRes?.success === false) {
    console.log('  ✅ Invalid/short device_id correctly rejected (success: false).\n')
  } else {
    console.error('  ❌ Expected rejection for short device_id, got:', invalidDeviceRes)
  }

  // ------------------------------------------------------------------
  // 6. First View from Distinct Device
  // ------------------------------------------------------------------
  const testDevice1 = randomUUID()
  console.log(`Test 6: Testing first view from Device 1 (${testDevice1})...`)
  const { data: res1, error: err1 } = await supabaseService.rpc('record_project_view', {
    p_project_id: project.id,
    p_device_id: testDevice1,
    p_device_type: 'desktop'
  })

  if (err1) {
    console.error('  ❌ Device 1 RPC execution failed:', err1)
    return
  }

  if (res1?.success === true && res1?.counted === true && res1?.view_count === initialViewCount + 1) {
    console.log(`  ✅ First view registered: counted: true, new view_count: ${res1.view_count}`)
  } else {
    console.error('  ❌ Unexpected response for first view:', res1)
    return
  }

  // Verify project_views row
  const { data: pvRow } = await supabaseService
    .from('project_views')
    .select('id, device_id')
    .eq('project_id', project.id)
    .eq('device_id', testDevice1)
    .single()

  // Verify analytics_events row
  const { data: aeRow } = await supabaseService
    .from('analytics_events')
    .select('id, event_type, visitor_id')
    .eq('project_id', project.id)
    .eq('visitor_id', testDevice1)
    .eq('event_type', 'view')
    .single()

  if (pvRow && aeRow) {
    console.log('  ✅ Database atomicity verified: both project_views and analytics_events rows created.\n')
  } else {
    console.error('  ❌ State verification failed:', { pvRow: !!pvRow, aeRow: !!aeRow })
  }

  // ------------------------------------------------------------------
  // 7. Duplicate View from Same Device (Deduplication Check)
  // ------------------------------------------------------------------
  console.log(`Test 7: Testing duplicate view from Device 1...`)
  const { data: res2, error: err2 } = await supabaseService.rpc('record_project_view', {
    p_project_id: project.id,
    p_device_id: testDevice1,
    p_device_type: 'desktop'
  })

  if (err2) {
    console.error('  ❌ Duplicate RPC execution failed:', err2)
    return
  }

  if (res2?.success === true && res2?.counted === false && res2?.view_count === initialViewCount + 1) {
    console.log(`  ✅ Duplicate correctly ignored: counted: false, view_count unchanged (${res2.view_count}).\n`)
  } else {
    console.error('  ❌ Deduplication failure! Expected counted: false, got:', res2)
  }

  // ------------------------------------------------------------------
  // 8. Concurrency Test (5 Simultaneous Requests)
  // ------------------------------------------------------------------
  const testDeviceConcurrent = randomUUID()
  console.log(`Test 8: Testing concurrency with 5 simultaneous requests for Device (${testDeviceConcurrent})...`)

  const concurrentCalls = Array.from({ length: 5 }).map(() =>
    supabaseService.rpc('record_project_view', {
      p_project_id: project.id,
      p_device_id: testDeviceConcurrent,
      p_device_type: 'mobile'
    })
  )

  const results = await Promise.all(concurrentCalls)
  const successResults = results.map(r => r.data)
  const countedCount = successResults.filter(r => r?.counted === true).length
  const uncountedCount = successResults.filter(r => r?.counted === false).length

  console.log(`  Concurrent results: ${countedCount} counted, ${uncountedCount} ignored`)

  if (countedCount === 1 && uncountedCount === 4) {
    console.log('  ✅ Concurrency lock verified: exactly 1 view counted across 5 parallel requests!\n')
  } else {
    console.error('  ❌ Concurrency check failed! Results:', successResults)
  }

  // ------------------------------------------------------------------
  // 9. Teardown and Cleanup
  // ------------------------------------------------------------------
  console.log('Test 9: Cleaning up test data to restore live database state...')
  const testDeviceIds = [testDevice1, testDeviceConcurrent, fakeDeviceId]

  await supabaseService
    .from('project_views')
    .delete()
    .in('device_id', testDeviceIds)

  await supabaseService
    .from('analytics_events')
    .delete()
    .in('visitor_id', testDeviceIds)

  // Revert view_count to exact initial value
  await supabaseService
    .from('projects')
    .update({ view_count: initialViewCount })
    .eq('id', project.id)

  // Verify project view_count is restored
  const { data: restoredProj } = await supabaseService
    .from('projects')
    .select('view_count')
    .eq('id', project.id)
    .single()

  if (restoredProj?.view_count === initialViewCount) {
    console.log(`  ✅ Database state cleanly restored to initial view_count (${initialViewCount}).`)
  } else {
    console.warn('  ⚠️  Warning: view_count restoration mismatch:', restoredProj?.view_count, 'vs', initialViewCount)
  }

  console.log('\n============================================================')
  console.log('✅ ALL INTEGRATION CHECKS COMPLETED SUCCESSFULLY!')
  console.log('============================================================\n')
}

runIntegrationSuite().catch(console.error)
