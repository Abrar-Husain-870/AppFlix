import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function inspect() {
  console.log('=== DEVELOPMENT DATABASE INSPECTION ===\n')

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, created_at')
  
  if (pErr) console.error('Profiles error:', pErr)
  console.log(`PROFILES (${profiles?.length ?? 0} total):`)
  console.table(profiles)

  const { data: projects, error: prErr } = await supabase
    .from('projects')
    .select('id, user_id, name, slug, status, deleted_at, approved_at, created_at')
  
  if (prErr) console.error('Projects error:', prErr)
  console.log(`\nPROJECTS (${projects?.length ?? 0} total):`)
  console.table(projects)

  // Group projects by user
  console.log('\nSUMMARY PER USER:')
  for (const prof of profiles ?? []) {
    const userProjects = (projects ?? []).filter(p => p.user_id === prof.id)
    const approved = userProjects.filter(p => p.status === 'approved' && !p.deleted_at)
    const pending = userProjects.filter(p => p.status === 'pending' && !p.deleted_at)
    const rejected = userProjects.filter(p => p.status === 'rejected' && !p.deleted_at)
    const deleted = userProjects.filter(p => p.deleted_at !== null || p.status === 'deleted')

    console.log(`User: ${prof.username} (${prof.id})`)
    console.log(`  Role: ${prof.role}`)
    console.log(`  Total projects: ${userProjects.length}`)
    console.log(`  Approved: ${approved.length}`)
    console.log(`  Pending: ${pending.length}`)
    console.log(`  Rejected: ${rejected.length}`)
    console.log(`  Deleted: ${deleted.length}`)
    if (userProjects.length > 0) {
      console.log('  Projects detail:')
      userProjects.forEach(p => {
        console.log(`    - [${p.status}] "${p.name}" (ID: ${p.id}, approved_at: ${p.approved_at})`)
      })
    }
    console.log('---')
  }
}

inspect()
