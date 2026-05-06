import { supabaseAdmin } from '@/lib/supabase'

export type AuditAction = 'create' | 'update' | 'delete' | 'generate'
export type AuditResource = 'contact' | 'event' | 'followup' | 'profile' | 'tag' | 'note'

/**
 * Writes a durable audit log entry to the `audit_logs` table.
 * Failures are logged server-side but never propagated to the caller — audit errors
 * must not break the primary API response.
 *
 * Required Supabase table:
 *   CREATE TABLE audit_logs (
 *     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id       text NOT NULL,
 *     action        text NOT NULL,
 *     resource_type text NOT NULL,
 *     resource_id   text NOT NULL,
 *     created_at    timestamptz NOT NULL DEFAULT now()
 *   );
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  resourceType: AuditResource,
  resourceId: string
): Promise<void> {
  const { error } = await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    created_at: new Date().toISOString(),
  })
  if (error) console.error('[audit] Failed to write audit log:', error.message)
}
