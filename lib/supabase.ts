import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !anon) {
  console.error('Missing Supabase environment variables!')
}

// Public client
export const supabase = createClient(url, anon, {
  auth: { persistSession: false }
})

// Admin client – bypasses RLS
export const supabaseAdmin = createClient(url, svc ?? anon, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    headers: { 'x-supabase-role': 'service_role' }
  }
})
