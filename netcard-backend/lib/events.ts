import { supabaseAdmin } from './supabase'

/**
 * Globally deactivates every event associated with a specific profile.
 * Sets `is_active` to false and resets status to 'upcoming' to ensure single-active event integrity.
 * 
 * @param {string} profileId - The UUID of the profile owner.
 */
export async function deactivateAllEvents(profileId: string) {
  await supabaseAdmin
    .from('events')
    .update({ is_active: false, status: 'upcoming' })
    .eq('profile_id', profileId)
}
