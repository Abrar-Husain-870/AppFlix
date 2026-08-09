import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function verify() {
  console.log('='.repeat(60))
  console.log('SCHEMA-DEV-PLUS VERIFICATION (AppFlix Development Database)')
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

  // 1. Check profiles table for free_listing_used column
  console.log('[1. PROFILES ENHANCEMENT]')
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, free_listing_used')
  
  check('profiles.free_listing_used column exists', !pErr, pErr?.message)
  
  const userDev = profiles?.find(p => p.username.startsWith('brainstormhusain'))
  check(
    'brainstormhusain free_listing_used = TRUE',
    userDev?.free_listing_used === true,
    `actual value: ${userDev?.free_listing_used}`
  )

  // 2. Check projects table for listing columns & migrated state
  console.log('\n[2. PROJECTS ENHANCEMENT & MIGRATION STATE]')
  const { data: projects, error: prErr } = await supabase
    .from('projects')
    .select('id, name, status, listing_type, listing_paid, listing_expires_at')
  
  check('projects listing columns exist', !prErr, prErr?.message)

  const jamaah = projects?.find(p => p.name.includes("Jamā'ah"))
  check(
    'Jamā\'ah Journal listing_type = "free"',
    jamaah?.listing_type === 'free',
    `actual: ${jamaah?.listing_type}`
  )
  check(
    'Jamā\'ah Journal listing_paid = TRUE',
    jamaah?.listing_paid === true,
    `actual: ${jamaah?.listing_paid}`
  )
  check(
    'Jamā\'ah Journal listing_expires_at IS NULL',
    jamaah?.listing_expires_at === null,
    `actual: ${jamaah?.listing_expires_at}`
  )

  // 3. Check listing_slots table
  console.log('\n[3. LISTING_SLOTS TABLE & RLS]')
  const { data: slots, error: sErr } = await supabase
    .from('listing_slots')
    .select('*')
    .limit(1)

  check('listing_slots table exists', !sErr, sErr?.message)

  console.log('\n' + '='.repeat(60))
  console.log(`SUMMARY: ${passes} passed, ${fails} failed`)
  console.log('='.repeat(60))

  return fails === 0
}

verify()
