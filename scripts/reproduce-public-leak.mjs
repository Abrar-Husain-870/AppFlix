import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY


if (!url || !key) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(url, key)

async function testPublicLeak() {
  console.log('Testing whether public queries return unpaid/expired approved projects...\n')

  // 1. Fetch an existing profile
  const { data: profile } = await supabase.from('profiles').select('id, username').limit(1).single()
  const catId = (await supabase.from('categories').select('id').limit(1).single()).data.id

  // 2. Insert an UNPAID approved project
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminClient = createClient(url, serviceKey)

  const { data: unpaidProj } = await adminClient.from('projects').insert({
    user_id: profile.id,
    name: `Unpaid Test App ${Date.now()}`,
    slug: `unpaid-test-app-${Date.now()}`,
    tagline: 'Unpaid test tagline',
    description: 'This is a test description long enough to pass the database check constraint for description length requirement.',
    category_id: catId,
    stage: 'production',
    platforms: ['web'],
    status: 'approved',
    listing_type: 'paid',
    listing_paid: false,
    listing_expires_at: null,
  }).select().single()

  console.log('Created Unpaid Approved Project:', unpaidProj.id, unpaidProj.name)

  // --- QUERY 1: Homepage getFeaturedProjects() ---
  // Query used in app/page.tsx:
  // .from('projects').select(...).eq('status', 'approved').is('deleted_at', null)
  const { data: homeFeatured } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .eq('id', unpaidProj.id)

  const leakedOnHome = (homeFeatured && homeFeatured.length > 0)
  console.log(`[Homepage Query] Unpaid project returned on homepage featured: ${leakedOnHome}`)

  // --- QUERY 2: Developer Profile page query ---
  // Query used in app/developer/[username]/page.tsx:
  // .from('projects').select(...).eq('user_id', profile.id).eq('status', 'approved').is('deleted_at', null)
  const { data: devProjects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', profile.id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .eq('id', unpaidProj.id)

  const leakedOnDevProfile = (devProjects && devProjects.length > 0)
  console.log(`[Developer Profile Query] Unpaid project returned on public dev profile: ${leakedOnDevProfile}`)

  // --- QUERY 3: Discover Developers query ---
  // Query used in DiscoverDevelopersSection.tsx:
  // .from('projects').select(...).eq('status', 'approved').is('deleted_at', null)
  const { data: discoverDevs } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .eq('id', unpaidProj.id)

  const leakedOnDiscover = (discoverDevs && discoverDevs.length > 0)
  console.log(`[Discover Developers Query] Unpaid project counted in developer directory: ${leakedOnDiscover}`)

  // Cleanup
  await adminClient.from('projects').delete().eq('id', unpaidProj.id)

  console.log('\n------------------------------------------------------------')
  console.log(`SUMMARY: Public leak confirmed on ${[leakedOnHome, leakedOnDevProfile, leakedOnDiscover].filter(Boolean).length}/3 queries!`)
  console.log('------------------------------------------------------------')
}

testPublicLeak()
