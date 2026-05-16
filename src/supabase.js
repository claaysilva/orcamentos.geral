import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to create a service-role client server-side. Only use in server code.
export function createServiceClient(serviceRoleKey){
  if(!serviceRoleKey) throw new Error('Service role key required');
  return createClient(process.env.SUPABASE_URL, serviceRoleKey);
}

export default supabase;
