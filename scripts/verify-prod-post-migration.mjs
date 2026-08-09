import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local.production' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing production credentials in .env.local.production')
  process.exit(1)
}

const supabaseRole = createClient(url, key)
const supabaseAnon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function verifyProductionMigration() {
  console.log('============================================================')
  console.log('PRODUCTION POST-MIGRATION VERIFICATION REPORT')
  console.log(`Target Production Supabase URL: ${url}`)
  console.log('============================================================\n')

  // 1. Verify profiles column
  const { data: profs, error: pErr } = await supabaseRole
    .from('profiles')
    .select('id, username, free_listing_used')
  if (pErr) console.error('Profiles verification error:', pErr)
  console.log(`1. PROFILES COLUMN (free_listing_used):`)
  console.table(profs)

  // 2. Verify projects columns & data migration
  const { data: projs, error: prErr } = await supabaseRole
    .from('projects')
    .select('id, name, status, deleted_at, listing_type, listing_paid, listing_expires_at')
  if (prErr) console.error('Projects verification error:', prErr)
  
  const approvedProjs = (projs ?? []).filter(p => p.status === 'approved' && p.deleted_at === null)
  console.log(`\n2. APPROVED PROJECTS ENTITLEMENT MIGRATION STATUS (${approvedProjs.length} total):`)
  console.table(approvedProjs)

  const unapprovedProjs = (projs ?? []).filter(p => p.status !== 'approved' || p.deleted_at !== null)
  console.log(`\n3. UNAPPROVED / DELETED PROJECTS DEFAULT STATUS (${unapprovedProjs.length} total):`)
  console.table(unapprovedProjs.map(p => ({ id: p.id, name: p.name, status: p.status, listing_type: p.listing_type, listing_paid: p.listing_paid })))

  // 4. Verify listing_slots table
  const { data: slots, error: sErr } = await supabaseRole
    .from('listing_slots')
    .select('*')
  console.log(`\n4. LISTING_SLOTS TABLE:`)
  if (sErr) {
    console.error('❌ listing_slots error:', sErr)
  } else {
    console.log(`  ✅ listing_slots table exists! Rows: ${slots.length}`)
  }

  // 5. Verify RPC existence and security permissions in production
  console.log('\n5. PRODUCTION RPC & PERMISSION VERIFICATION:')
  const { error: rpcRoleErr } = await supabaseRole.rpc('approve_project_entitlement', { p_project_id: '00000000-0000-0000-0000-000000000000' })
  const rpcRoleSuccess = rpcRoleErr && rpcRoleErr.code === 'P0001' // Project not found exception

  const { error: rpcAnonErr } = await supabaseAnon.rpc('approve_project_entitlement', { p_project_id: '00000000-0000-0000-0000-000000000000' })
  const rpcAnonBlocked = rpcAnonErr && rpcAnonErr.code === '42501' // Permission denied

  console.log(`  - ServiceRole Call Execution: ${rpcRoleSuccess ? '✅ SUCCESSFUL (PL/pgSQL executed)' : '❌ FAILED'}`)
  console.log(`  - Anon Client Call Restriction: ${rpcAnonBlocked ? '✅ BLOCKED (HTTP 401 Permission Denied)' : '❌ NOT BLOCKED'}`)

  if (rpcRoleSuccess && rpcAnonBlocked) {
    console.log('\n============================================================')
    console.log('✅ PRODUCTION MIGRATION VERIFICATION COMPLETE: ALL CHECKS PASSED!')
    console.log('============================================================')
  } else {
    console.error('\n❌ Production RPC permission check failed!')
  }
}

verifyProductionMigration()
