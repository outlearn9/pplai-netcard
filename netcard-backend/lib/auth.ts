import { auth } from '@clerk/nextjs/server'
import { jwtVerify } from 'jose'
import { headers } from 'next/headers'

const MOCK_PROFILE = {
  id: '00000000-0000-0000-0000-000000000000',
  clerk_user_id: 'user_mock_123',
  name: 'Antigravity Dev',
  role: 'AI Assistant',
  company: 'DeepMind',
  email: 'dev@antigravity.codes',
  avatar_initials: 'AD',
  avatar_gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  city: 'San Francisco',
  country: 'USA',
  username: 'antigravity-dev',
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return new TextEncoder().encode(secret)
}

// Convert a display name to a URL-safe slug: "Paras Gupta" → "paras-gupta"
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'user'
}

// Generate a unique username, appending a short random suffix if the base is taken
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateUsername(base: string, supabaseAdmin: any): Promise<string> {
  const slug = nameToSlug(base)
  // Try the clean slug first, then slug + random 3-char suffix
  const candidates = [
    slug,
    ...Array.from({ length: 8 }, () => `${slug}-${Math.random().toString(36).slice(2, 5)}`),
  ]
  for (const candidate of candidates) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  // Fallback: timestamp suffix, guaranteed unique
  return `${slug}-${Date.now().toString(36)}`
}

export async function getProfile() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return MOCK_PROFILE
  }

  const headersList = await headers()
  const authorization = headersList.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7)
    try {
      const secret = getJwtSecret()
      const { payload } = await jwtVerify(token, secret)
      const userId = payload.sub
      if (!userId) throw new Error('No sub in JWT')
      const name = typeof payload.name === 'string' ? payload.name : undefined
      return await fetchOrCreateProfile(userId, name)
    } catch (e) {
      console.error('[auth] JWT verify failed:', e)
      throw new Error('Unauthenticated')
    }
  }

  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')
  return await fetchOrCreateProfile(userId)
}

async function fetchOrCreateProfile(userId: string, name?: string) {
  const { supabaseAdmin } = await import('./supabase')

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // New user — generate a username from their name
    const displayName = name ?? 'user'
    const username = await generateUsername(displayName, supabaseAdmin)

    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({ clerk_user_id: userId, username })
      .select()
      .single()
    if (createError) throw createError
    return newProfile
  }

  if (error) throw error

  // Backfill username for existing profiles that don't have one yet
  if (!data.username) {
    const username = await generateUsername(data.name || name || userId.slice(-8), supabaseAdmin)
    const { data: updated } = await supabaseAdmin
      .from('profiles')
      .update({ username })
      .eq('id', data.id)
      .select()
      .single()
    return updated ?? data
  }

  return data
}
