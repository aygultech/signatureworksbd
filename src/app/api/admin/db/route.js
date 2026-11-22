import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/lib/supabaseAdmin'
import { getAdminSession, canAccess } from '@/lib/adminSession'

// Table -> admin permission section required to touch it.
const TABLE_SECTIONS = {
  contact_submissions: 'contacts',
  bookings: 'bookings',
  portfolio_projects: 'portfolio',
  blog_posts: 'blog',
  site_settings: 'settings',
}

// Tables whose content is rendered on public (cached) pages.
const PUBLIC_CONTENT_TABLES = new Set(['portfolio_projects', 'blog_posts', 'site_settings'])

const ACTIONS = new Set(['select', 'insert', 'update', 'delete', 'upsert'])
const FILTER_OPS = new Set(['eq', 'neq', 'in'])
const IDENT = /^[a-z_][a-z0-9_]*$/
const COLUMNS = /^(\*|[a-z_][a-z0-9_]*(\s*,\s*[a-z_][a-z0-9_]*)*)$/

function bad(message, status = 400) {
  return NextResponse.json({ data: null, count: null, error: { message } }, { status })
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return bad('Unauthorized', 401)

  let q
  try { q = await request.json() } catch { return bad('Invalid JSON') }

  const section = TABLE_SECTIONS[q?.table]
  if (!section) return bad('Unknown table')
  if (!ACTIONS.has(q.action)) return bad('Unknown action')

  // Row counts (no row data) are allowed for any signed-in admin so the dashboard renders;
  // everything else requires permission for the table's section.
  const isCountOnly = q.action === 'select' && q.head === true
  if (!isCountOnly && !canAccess(session, section)) return bad('Forbidden', 403)

  const sb = getServiceClient()
  if (!sb) return bad('Server database is not configured', 500)

  const columns = typeof q.columns === 'string' && COLUMNS.test(q.columns) ? q.columns : '*'
  const hasFilter = Array.isArray(q.filters) && q.filters.length > 0
  let query = sb.from(q.table)

  switch (q.action) {
    case 'select':
      query = query.select(columns, q.count === 'exact' ? { count: 'exact', head: q.head === true } : undefined)
      break
    case 'insert':
      query = query.insert(q.values)
      break
    case 'update':
      if (!hasFilter) return bad('Update requires a filter')
      query = query.update(q.values)
      break
    case 'delete':
      if (!hasFilter) return bad('Delete requires a filter')
      query = query.delete()
      break
    case 'upsert': {
      const onConflict = typeof q.onConflict === 'string' && IDENT.test(q.onConflict) ? q.onConflict : undefined
      query = query.upsert(q.values, onConflict ? { onConflict } : undefined)
      break
    }
  }

  for (const f of q.filters || []) {
    if (!Array.isArray(f) || !FILTER_OPS.has(f[0]) || !IDENT.test(f[1])) return bad('Invalid filter')
    if (f[0] === 'in' && !Array.isArray(f[2])) return bad('Invalid filter')
    query = query[f[0]](f[1], f[2])
  }

  if (q.returning && q.action !== 'select') query = query.select(columns)

  if (q.order) {
    if (!IDENT.test(q.order.column)) return bad('Invalid order')
    query = query.order(q.order.column, { ascending: q.order.ascending !== false })
  }
  if (Number.isInteger(q.limit) && q.limit > 0) query = query.limit(Math.min(q.limit, 1000))
  if (q.single) query = query.single()

  const { data, count, error } = await query

  // Purge cached public pages so admin edits appear immediately.
  if (!error && q.action !== 'select' && PUBLIC_CONTENT_TABLES.has(q.table)) {
    revalidatePath('/', 'layout')
  }
  return NextResponse.json({
    data: data ?? null,
    count: count ?? null,
    error: error ? { message: error.message } : null,
  })
}
