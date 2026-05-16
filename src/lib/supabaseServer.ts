import { createClient } from '@supabase/supabase-js'

let supabase = null as any

export function getSupabase(){
  if(supabase) return supabase
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
  if(!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured')
  supabase = createClient(url, key)
  return supabase
}
