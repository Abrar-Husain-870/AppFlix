import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  const sql = fs.readFileSync('schema-dev-plus.sql', 'utf8')
  console.log('Attempting migration via Supabase client...')
  
  // Try executing via rpc if sql execution function exists
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) {
    console.log('RPC exec_sql not available:', error.message)
    console.log('\nSupabase REST API does not expose raw DDL execution endpoints without a custom database function or direct Postgres connection.')
    console.log('Please paste schema-dev-plus.sql into the Supabase SQL Editor for appflix-development.')
  } else {
    console.log('Successfully executed schema-dev-plus.sql via RPC!')
  }
}

run()
