import { auth } from '@clerk/nextjs/server'

// MOCK DATA for local development
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
  country: 'USA'
}

/**
 * Retrieves the currently authenticated Supabase profile record.
 * Uses NEXT_PUBLIC_MOCK_AUTH to toggle between real Clerk auth and local mock data.
 */
export async function getProfile() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return MOCK_PROFILE
  }

  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')

  const { supabaseAdmin } = await import('./supabase')

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({ clerk_user_id: userId })
      .select()
      .single()
    if (createError) throw createError
    return newProfile
  }

  if (error) throw error
  return data
}
