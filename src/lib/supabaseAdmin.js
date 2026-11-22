import 'server-only'
import { createClient } from '@supabase/supabase-js'

let cached = null

/**
 * Supabase client using the service_role key. Bypasses RLS.
 * Server-only: never import this from a client component.
 */
export function getServiceClient() {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  cached = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  return cached
}
