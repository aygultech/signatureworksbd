import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabaseAdmin'
import { getAdminSession, canAccess } from '@/lib/adminSession'

const BUCKET = 'site-media'
const SAFE_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/

function bad(message, status = 400) {
  return NextResponse.json({ data: null, error: { message } }, { status })
}

// Content editors (media, portfolio, blog, settings) may upload. Listing and deleting require "media".
function canUpload(session) {
  return ['media', 'portfolio', 'blog', 'settings'].some(s => canAccess(session, s))
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return bad('Unauthorized', 401)

  let body
  try { body = await request.json() } catch { return bad('Invalid JSON') }

  const sb = getServiceClient()
  if (!sb) return bad('Server storage is not configured', 500)
  const bucket = sb.storage.from(BUCKET)

  switch (body?.action) {
    case 'list': {
      // Editors need the list too, for the "Choose from Media Library" picker.
      if (!canUpload(session)) return bad('Forbidden', 403)
      // Form uploads used to land in images/ and videos/; the library shows every folder.
      const folders = ['', 'images', 'videos']
      const results = await Promise.all(folders.map(folder => bucket.list(folder, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      })))
      const failed = results.find(r => r.error)
      if (failed) return NextResponse.json({ data: null, error: { message: failed.error.message } })
      const data = results
        .flatMap((r, i) => (r.data || [])
          .filter(f => f.id && f.name !== '.emptyFolderPlaceholder') // folders have no id
          .map(f => ({ ...f, name: folders[i] ? `${folders[i]}/${f.name}` : f.name })))
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      return NextResponse.json({ data, error: null })
    }
    case 'remove': {
      if (!canAccess(session, 'media')) return bad('Forbidden', 403)
      const paths = Array.isArray(body.paths) ? body.paths : []
      if (!paths.length || !paths.every(p => typeof p === 'string' && SAFE_PATH.test(p))) return bad('Invalid paths')
      const { data, error } = await bucket.remove(paths)
      return NextResponse.json({ data, error: error ? { message: error.message } : null })
    }
    case 'signUpload': {
      // Returns a one-time signed URL; the browser uploads the file directly to Supabase Storage,
      // so large files never pass through the edge worker.
      if (!canUpload(session)) return bad('Forbidden', 403)
      if (typeof body.path !== 'string' || !SAFE_PATH.test(body.path)) return bad('Invalid path')
      const { data, error } = await bucket.createSignedUploadUrl(body.path)
      return NextResponse.json({ data, error: error ? { message: error.message } : null })
    }
    default:
      return bad('Unknown action')
  }
}
