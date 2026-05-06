-- =============================================
-- Sample data tracking columns
-- Run in Supabase SQL Editor
-- =============================================

-- Track whether the user has been seeded with sample data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seeded_at TIMESTAMPTZ DEFAULT NULL;

-- Mark which events/contacts/followups are sample data so they can be bulk-deleted
ALTER TABLE events       ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contacts     ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ai_followups ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast sample-data cleanup
CREATE INDEX IF NOT EXISTS events_sample     ON events(profile_id)  WHERE is_sample = TRUE;
CREATE INDEX IF NOT EXISTS contacts_sample   ON contacts(owner_id)   WHERE is_sample = TRUE;
CREATE INDEX IF NOT EXISTS followups_sample  ON ai_followups(owner_id) WHERE is_sample = TRUE;
