-- =============================================
-- Notifications table
-- Run in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL DEFAULT 'system',   -- connection | followup | ai | feature | system
  title       TEXT        NOT NULL,
  body        TEXT,
  action_nav  TEXT,        -- frontend nav id (e.g. 'contact', 'ai', 'events')
  action_label TEXT,       -- CTA button label
  action_data  JSONB,      -- optional payload passed to navigate()
  icon        TEXT,        -- icon key: followup | chat | ai | events | analytics | connection
  icon_bg     TEXT,        -- hex/css color for avatar circle
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_owner_created
  ON notifications(owner_id, created_at DESC);

-- RLS (if enabled) — service-role key bypasses RLS anyway
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner access" ON notifications
  USING (owner_id = (SELECT id FROM profiles WHERE clerk_user_id = auth.uid()::text));
