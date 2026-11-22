import 'server-only'
import { getServiceClient } from '@/lib/supabaseAdmin'

/**
 * Fixed-window rate limiter backed by Postgres (table: admin_auth_attempts).
 * Works across all edge isolates, unlike an in-memory counter.
 *
 * Returns { allowed, retryAfter } where retryAfter is in seconds.
 * Fails closed: if the database is unreachable, the attempt is refused.
 */
export async function hitRateLimit(key, { limit, windowSeconds }) {
  const sb = getServiceClient()
  if (!sb) return { allowed: false, retryAfter: 60 }

  const { data, error } = await sb.rpc('admin_auth_hit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error || !data || !data[0]) return { allowed: false, retryAfter: 60 }
  return { allowed: data[0].allowed, retryAfter: data[0].retry_after }
}

export async function clearRateLimit(key) {
  const sb = getServiceClient()
  if (!sb) return
  await sb.from('admin_auth_attempts').delete().eq('key', key)
}

export function clientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}
