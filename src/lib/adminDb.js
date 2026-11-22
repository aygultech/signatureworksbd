'use client'

/**
 * Browser-side admin data client.
 *
 * Mirrors the subset of the supabase-js query builder used by the admin panel, but every
 * call is executed server-side by /api/admin/db and /api/admin/storage after the admin
 * session and section permissions are verified. The public anon key therefore has no
 * read/write access to private tables.
 */
import { supabase as publicClient } from '@/lib/supabase'

async function post(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401 && typeof window !== 'undefined') window.location.href = '/admin/login'
    if (!json) return { data: null, count: null, error: { message: `Request failed (${res.status})` } }
    return json
  } catch (err) {
    return { data: null, count: null, error: { message: err?.message || 'Network error' } }
  }
}

class QueryBuilder {
  constructor(table) {
    this.q = { table, action: 'select', columns: '*', filters: [] }
  }
  select(columns = '*', opts = {}) {
    if (this.q.action === 'select') {
      this.q.columns = columns
      if (opts.count) this.q.count = opts.count
      if (opts.head) this.q.head = true
    } else {
      this.q.returning = true
      this.q.columns = columns
    }
    return this
  }
  insert(values) { this.q.action = 'insert'; this.q.values = values; return this }
  update(values) { this.q.action = 'update'; this.q.values = values; return this }
  upsert(values, opts = {}) { this.q.action = 'upsert'; this.q.values = values; this.q.onConflict = opts.onConflict; return this }
  delete() { this.q.action = 'delete'; return this }
  eq(column, value) { this.q.filters.push(['eq', column, value]); return this }
  neq(column, value) { this.q.filters.push(['neq', column, value]); return this }
  in(column, values) { this.q.filters.push(['in', column, values]); return this }
  order(column, opts = {}) { this.q.order = { column, ascending: opts.ascending !== false }; return this }
  limit(n) { this.q.limit = n; return this }
  single() { this.q.single = true; return this }
  then(resolve, reject) { return post('/api/admin/db', this.q).then(resolve, reject) }
}

const publicUrl = (bucket, path) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

function storageBucket(bucket) {
  return {
    list: () => post('/api/admin/storage', { action: 'list' }),
    remove: (paths) => post('/api/admin/storage', { action: 'remove', paths }),
    async upload(path, file, opts = {}) {
      const signed = await post('/api/admin/storage', { action: 'signUpload', path })
      if (signed.error) return { data: null, error: signed.error }
      if (!publicClient) return { data: null, error: { message: 'Supabase not configured.' } }
      const { data, error } = await publicClient.storage
        .from(bucket)
        .uploadToSignedUrl(signed.data.path, signed.data.token, file, {
          // Uploaded names are unique (timestamped), so they can be cached for a year.
          cacheControl: opts.cacheControl || '31536000',
          contentType: file.type || undefined,
        })
      return { data, error: error ? { message: error.message } : null }
    },
    getPublicUrl: (path) => ({ data: { publicUrl: publicUrl(bucket, path) } }),
  }
}

export const adminDb = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? { from: (table) => new QueryBuilder(table), storage: { from: storageBucket } }
  : null
