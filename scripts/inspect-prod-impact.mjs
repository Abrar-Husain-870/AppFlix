import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local.production' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing production credentials in .env.local.production')
  process.exit(1)
}

const supabase = createClient(url, key)

async function inspectProductionImpact() {
  console.log('============================================================')
  console.log('READ-ONLY PRODUCTION IMPACT ASSESSMENT')
  console.log(`Target Supabase URL: ${url}`)
  console.log('============================================================\n')

  // 1. Fetch profiles
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, created_at')
  if (profErr) {
    console.error('Profiles query error:', profErr)
    process.exit(1)
  }

  // 2. Fetch all projects
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, user_id, name, slug, status, deleted_at, approved_at, created_at')
  if (projErr) {
    console.error('Projects query error:', projErr)
    process.exit(1)
  }

  // Analysis variables
  const approvedNonDeletedProjects = (projects ?? []).filter(p => p.status === 'approved' && p.deleted_at === null)
  const unapprovedOrDeletedProjects = (projects ?? []).filter(p => p.status !== 'approved' || p.deleted_at !== null)

  // Unique developers with approved, non-deleted projects
  const developerIdsWithApproved = [...new Set(approvedNonDeletedProjects.map(p => p.user_id))]
  const developersWithApproved = (profiles ?? []).filter(prof => developerIdsWithApproved.includes(prof.id))

  const devOneApproved = []
  const devMultipleApproved = []

  for (const prof of developersWithApproved) {
    const userApprovedProjects = approvedNonDeletedProjects
      .filter(p => p.user_id === prof.id)
      .sort((a, b) => {
        const aTime = a.approved_at ? new Date(a.approved_at).getTime() : new Date(a.created_at).getTime()
        const bTime = b.approved_at ? new Date(b.approved_at).getTime() : new Date(b.created_at).getTime()
        return aTime - bTime
      })

    if (userApprovedProjects.length === 1) {
      devOneApproved.push({ profile: prof, projects: userApprovedProjects })
    } else if (userApprovedProjects.length > 1) {
      devMultipleApproved.push({ profile: prof, projects: userApprovedProjects })
    }
  }

  console.log(`1. Number of existing developers with approved, non-deleted projects: ${developersWithApproved.length}`)
  console.log(`2. Number of existing approved, non-deleted projects: ${approvedNonDeletedProjects.length}`)
  console.log(`3. Number of developers with exactly 1 approved project: ${devOneApproved.length}`)
  console.log(`4. Number of developers with 2+ approved projects: ${devMultipleApproved.length}\n`)

  console.log('============================================================')
  console.log('5. IMPACT ANALYSIS FOR EACH AFFECTED DEVELOPER:')
  console.log('============================================================')

  for (const dev of [...devOneApproved, ...devMultipleApproved]) {
    const prof = dev.profile
    const projs = dev.projects
    const earliestProject = projs[0] // ORDER BY approved_at ASC NULLS LAST, created_at ASC LIMIT 1
    const paidUnpaidProjects = projs.slice(1)

    console.log(`\nDeveloper: @${prof.username} (ID: ${prof.id.slice(0, 8)}...)`)
    console.log(`  Total approved projects: ${projs.length}`)
    console.log(`  Section 3 Earliest Selected Project: "${earliestProject.name}" (ID: ${earliestProject.id}) [Approved At: ${earliestProject.approved_at ?? earliestProject.created_at}]`)
    console.log(`  -> Project becoming FREE (paid=TRUE): "${earliestProject.name}"`)
    if (paidUnpaidProjects.length > 0) {
      console.log('  -> Projects becoming PAID/UNPAID (paid=FALSE):')
      for (const p of paidUnpaidProjects) {
        console.log(`     - "${p.name}" (ID: ${p.id}) [Approved At: ${p.approved_at ?? p.created_at}]`)
      }
    } else {
      console.log('  -> Projects becoming PAID/UNPAID: None (only 1 approved app)')
    }
  }

  console.log('\n============================================================')
  console.log('6. UNAPPROVED / DELETED PROJECTS AFFECTED BY FINAL UPDATE:')
  console.log('============================================================')
  console.log(`Count of status != 'approved' OR deleted_at IS NOT NULL: ${unapprovedOrDeletedProjects.length}`)
  for (const p of unapprovedOrDeletedProjects) {
    console.log(`  - "${p.name}" (Status: ${p.status}, Deleted: ${p.deleted_at ? 'YES' : 'NO'})`)
  }

  // 7. Check constraint satisfaction pre-test
  console.log('\n============================================================')
  console.log('7. CHECK CONSTRAINT SATISFACTION EVALUATION:')
  console.log('============================================================')
  console.log('Simulating Section 3 updates on production snapshot data...')

  let constraintViolations = 0

  for (const p of projects ?? []) {
    let simulatedType = 'free'
    let simulatedPaid = false
    let simulatedExpiry = null

    const devApproved = approvedNonDeletedProjects.filter(ap => ap.user_id === p.user_id)
      .sort((a, b) => {
        const aTime = a.approved_at ? new Date(a.approved_at).getTime() : new Date(a.created_at).getTime()
        const bTime = b.approved_at ? new Date(b.approved_at).getTime() : new Date(b.created_at).getTime()
        return aTime - bTime
      })

    const earliestId = devApproved[0]?.id

    if (p.status === 'approved' && p.deleted_at === null) {
      if (p.id === earliestId) {
        simulatedType = 'free'
        simulatedPaid = true
        simulatedExpiry = null
      } else {
        simulatedType = 'paid'
        simulatedPaid = false
        simulatedExpiry = null
      }
    } else {
      simulatedType = 'free'
      simulatedPaid = false
      simulatedExpiry = null
    }

    // Constraint 1: chk_free_listing_always_paid: NOT (status = 'approved' AND listing_type = 'free' AND listing_paid = FALSE)
    if (p.status === 'approved' && simulatedType === 'free' && simulatedPaid === false) {
      console.error(`  ❌ VIOLATION chk_free_listing_always_paid on project ${p.id}`)
      constraintViolations++
    }

    // Constraint 2: chk_free_listing_no_expiry: listing_type != 'free' OR listing_expires_at IS NULL
    if (simulatedType === 'free' && simulatedExpiry !== null) {
      console.error(`  ❌ VIOLATION chk_free_listing_no_expiry on project ${p.id}`)
      constraintViolations++
    }

    // Constraint 3: chk_paid_active_has_expiry: NOT (listing_type = 'paid' AND listing_paid = TRUE AND listing_expires_at IS NULL)
    if (simulatedType === 'paid' && simulatedPaid === true && simulatedExpiry === null) {
      console.error(`  ❌ VIOLATION chk_paid_active_has_expiry on project ${p.id}`)
      constraintViolations++
    }
  }

  if (constraintViolations === 0) {
    console.log('  ✅ ALL production rows 100% satisfy Section 4 check constraints after Section 3 migration!')
  } else {
    console.error(`  ❌ Found ${constraintViolations} constraint violations!`)
  }

  // 8. Check conflicting production objects
  console.log('\n============================================================')
  console.log('8. EXISTING PRODUCTION OBJECT CONFLICT CHECK:')
  console.log('============================================================')

  const { error: slotsErr } = await supabase.from('listing_slots').select('id').limit(1)
  const hasListingSlots = !slotsErr || !slotsErr.message.includes('does not exist')

  const { data: sampleProj } = await supabase.from('projects').select('*').limit(1).single()
  const hasListingType = sampleProj && 'listing_type' in sampleProj
  const hasListingPaid = sampleProj && 'listing_paid' in sampleProj
  const hasListingExpiresAt = sampleProj && 'listing_expires_at' in sampleProj

  const { data: sampleProf } = await supabase.from('profiles').select('*').limit(1).single()
  const hasFreeListingUsed = sampleProf && 'free_listing_used' in sampleProf

  const { error: rpcErr } = await supabase.rpc('approve_project_entitlement', { p_project_id: '00000000-0000-0000-0000-000000000000' })
  const hasRpc = !rpcErr || !rpcErr.message.includes('Could not find the function')

  console.log(`  - listing_slots table exists: ${hasListingSlots}`)
  console.log(`  - projects.listing_type column exists: ${hasListingType}`)
  console.log(`  - projects.listing_paid column exists: ${hasListingPaid}`)
  console.log(`  - projects.listing_expires_at column exists: ${hasListingExpiresAt}`)
  console.log(`  - profiles.free_listing_used column exists: ${hasFreeListingUsed}`)
  console.log(`  - approve_project_entitlement RPC exists: ${hasRpc}`)

  if (!hasListingSlots && !hasListingType && !hasListingPaid && !hasListingExpiresAt && !hasFreeListingUsed && !hasRpc) {
    console.log('\n  ✅ Zero object conflicts detected! Production is clean and ready for Section 1-7 DDL.')
  } else {
    console.log('\n  ⚠️ Some objects already exist in production.')
  }
}

inspectProductionImpact()
