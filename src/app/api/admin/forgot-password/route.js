import { NextResponse } from 'next/server'
import { findUserByEmail, createResetToken } from '@/lib/db/adminUsers'
import { getSettingsMap } from '@/lib/db/siteSettings'
import { hitRateLimit, clientIp } from '@/lib/rateLimit'

/**
 * Sends the reset code via the EmailJS REST API.
 * Server-side calls require, in the EmailJS dashboard: Account -> Security ->
 * "Allow EmailJS API for non-browser applications", plus EMAILJS_PRIVATE_KEY.
 */
async function sendResetEmail(toEmail, token, { service_id, public_key, template_id }) {
  const accessToken = process.env.EMAILJS_PRIVATE_KEY
  if (!service_id || !public_key || !template_id || !accessToken) return false
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id: public_key,
        accessToken,
        template_params: { to_email: toEmail, reset_token: token, expiry: '1 hour' },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// The response is identical whether or not the account exists or the email was delivered,
// and the code itself is never returned to the browser.
const GENERIC = { ok: true }

export async function POST(request) {
  let body
  try { body = await request.json() } catch { body = {} }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const [ipLimit, emailLimit] = await Promise.all([
    hitRateLimit(`forgot:ip:${clientIp(request)}`, { limit: 10, windowSeconds: 60 * 60 }),
    hitRateLimit(`forgot:email:${email}`, { limit: 3, windowSeconds: 60 * 60 }),
  ])
  if (!ipLimit.allowed || !emailLimit.allowed) return NextResponse.json(GENERIC)

  const user = await findUserByEmail(email)
  if (!user) return NextResponse.json(GENERIC)

  const token = await createResetToken(email)

  const map = await getSettingsMap(['emailjs_service_id', 'emailjs_public_key', 'emailjs_reset_template_id'])
  const sent = await sendResetEmail(email, token, {
    service_id: map.emailjs_service_id || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    public_key: map.emailjs_public_key || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    template_id: map.emailjs_reset_template_id || process.env.EMAILJS_RESET_TEMPLATE_ID,
  })
  if (!sent) console.error('[forgot-password] Reset email could not be sent; check EmailJS configuration.')

  return NextResponse.json(GENERIC)
}
