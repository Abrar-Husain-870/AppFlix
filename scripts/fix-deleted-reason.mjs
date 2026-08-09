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

async function clean() {
  // Update cycle project to ensure rejection_reason is null for developer self-deletion
  const { data: proj, error } = await supabase
    .from('projects')
    .update({ rejection_reason: null })
    .eq('name', 'cycle')
    .select('id, name, status, rejection_reason')

  console.log('Updated project:', proj, error)
}

clean()
