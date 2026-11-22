import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findUserByEmail, verifyPassword, countUsers, createUser } from '@/lib/db/adminUsers'
import { createSession, COOKIE_NAME, COOKIE_OPTIONS, INFO_COOKIE_NAME, INFO_COOKIE_OPTIONS, makeInfoPayload } from '@/lib/auth'
import { hitRateLimit, clearRateLimit, clientIp } from '@/lib/rateLimit'

const INVALID = 'Invalid credentials.'

export async function POST(request) {
  let body
  try { body = await request.json() } catch { body = {} }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  // Brute-force protection: per IP and per account.
  const ipKey = `login:ip:${clientIp(request)}`
  const emailKey = `login:email:${email}`
  const [ipLimit, emailLimit] = await Promise.all([
    hitRateLimit(ipKey, { limit: 20, windowSeconds: 15 * 60 }),
    hitRateLimit(emailKey, { limit: 5, windowSeconds: 15 * 60 }),
  ])
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfter || 0, emailLimit.retryAfter || 0)
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  let user = await findUserByEmail(email)

  // One-time bootstrap: only when no admin exists yet, ADMIN_PASSWORD creates the first super admin.
  // Once any admin exists, ADMIN_PASSWORD grants nothing.
  if (!user) {
    const adminPassword = process.env.ADMIN_PASSWORD?.trim()
    if (adminPassword && adminPassword.length >= 12 && password === adminPassword && (await countUsers()) === 0) {
      user = await createUser({ email, name: 'Super Admin', password, role: 'super_admin' })
    } else {
      return NextResponse.json({ error: INVALID }, { status: 401 })
    }
  } else if (!(await verifyPassword(user, password))) {
    return NextResponse.json({ error: INVALID }, { status: 401 })
  }

  await clearRateLimit(emailKey)

  const token = await createSession(user)
  const cookieStore = (await cookies())
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  cookieStore.set(INFO_COOKIE_NAME, makeInfoPayload(user), INFO_COOKIE_OPTIONS)
  return NextResponse.json({ ok: true })
}
