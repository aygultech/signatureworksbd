import 'server-only'
import { cookies } from 'next/headers'
import { parseSession, canAccess, COOKIE_NAME } from '@/lib/auth'

export async function getAdminSession() {
  return parseSession((await cookies()).get(COOKIE_NAME)?.value)
}

export { canAccess }
