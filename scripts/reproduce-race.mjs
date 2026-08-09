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

async function testRace() {
  console.log('Testing concurrency race condition on approveProject...')

  const { data: profile } = await supabase.from('profiles').select('id, free_listing_used').limit(1).single()
  const testUserId = profile.id
  const originalFreeUsed = profile.free_listing_used

  // Temporarily reset free_listing_used to false
  await supabase.from('profiles').update({ free_listing_used: false }).eq('id', testUserId)


  const catId = (await supabase.from('categories').select('id').limit(1).single()).data.id

  // 2. Insert two pending projects for this user
  const { data: p1, error: e1 } = await supabase.from('projects').insert({
    user_id: testUserId,
    name: `Race Project 1 ${Date.now()}`,
    slug: `race-proj-1-${Date.now()}`,
    tagline: 'Race test 1',
    description: 'This is a test description long enough to pass the database check constraint for description length requirement 1.',

    category_id: catId,
    stage: 'production',
    platforms: ['web'],
    status: 'pending',
  }).select().single()

  const { data: p2, error: e2 } = await supabase.from('projects').insert({
    user_id: testUserId,
    name: `Race Project 2 ${Date.now()}`,
    slug: `race-proj-2-${Date.now()}`,
    tagline: 'Race test 2',
    description: 'This is a test description long enough to pass the database check constraint for description length requirement 2.',

    category_id: catId,
    stage: 'production',
    platforms: ['web'],
    status: 'pending',
  }).select().single()

  if (e1 || e2) console.error('Insertion errors:', e1, e2)


  // Simulate concurrent approveProject logic as implemented in admin.ts
  async function simulateApprove(projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('free_listing_used')
      .eq('id', project.user_id)
      .single()

    const freeListingUsed = profile?.free_listing_used ?? false
    const now = new Date().toISOString()

    if (!freeListingUsed) {
      // Simulate delay between read and update to expose race condition
      await new Promise(r => setTimeout(r, 50))

      await supabase
        .from('profiles')
        .update({ free_listing_used: true })
        .eq('id', project.user_id)

      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'free',
          listing_paid: true,
          listing_expires_at: null,
        })
        .eq('id', projectId)
    }
  }

  // Run both concurrently
  await Promise.all([simulateApprove(p1.id), simulateApprove(p2.id)])

  // Check results
  const { data: res1 } = await supabase.from('projects').select('listing_type, listing_paid').eq('id', p1.id).single()
  const { data: res2 } = await supabase.from('projects').select('listing_type, listing_paid').eq('id', p2.id).single()

  console.log('Result P1:', res1)
  console.log('Result P2:', res2)

  const BOTH_FREE = res1.listing_type === 'free' && res2.listing_type === 'free'
  console.log('Were BOTH projects granted free listing?', BOTH_FREE)

  // Cleanup
  await supabase.from('projects').delete().in('id', [p1.id, p2.id])
  await supabase.from('profiles').update({ free_listing_used: originalFreeUsed }).eq('id', testUserId)

}

testRace()
