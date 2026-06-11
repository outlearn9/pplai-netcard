-- =============================================
-- NetCard Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES (one per user, acts as digital card)
-- =============================================
CREATE TABLE profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL DEFAULT '',
  role             TEXT,
  company          TEXT,
  email            TEXT,
  phone            TEXT,
  linkedin_url     TEXT,
  avatar_initials  TEXT,
  avatar_gradient  TEXT DEFAULT 'grad-purple',
  seeking          TEXT,   -- what they want at events
  offering         TEXT,   -- what they offer
  city             TEXT,
  country          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EVENTS
-- =============================================
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  location    TEXT,
  seeking     TEXT,
  offering    TEXT,
  is_active   BOOLEAN DEFAULT FALSE,
  status      TEXT DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'past')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active event per user
CREATE UNIQUE INDEX one_active_event_per_user
  ON events (profile_id)
  WHERE is_active = TRUE;

-- =============================================
-- CONTACTS
-- =============================================
CREATE TABLE contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE SET NULL,
  -- Card info (scanned from QR or manually entered)
  name             TEXT NOT NULL,
  role             TEXT,
  company          TEXT,
  email            TEXT,
  phone            TEXT,
  linkedin_url     TEXT,
  avatar_initials  TEXT,
  avatar_gradient  TEXT DEFAULT 'grad-purple',
  -- Classification
  role_bucket      TEXT,  -- Sales, Engg, UX, CXO, Ops, Investor, Angel, Banker, Founders
  contact_type     TEXT,  -- Exhibitor, Visitor, Panelist, Student, Organiser
  offering_bucket  TEXT,  -- IT Services, AI Services, SaaS, Funding, Bankers
  seeking_bucket   TEXT,  -- Job, Clients, Dist. Partners, Early Customers
  mode             TEXT,  -- Seeking | Offering
  city             TEXT,
  country          TEXT,
  -- Status
  bookmarked       BOOLEAN DEFAULT FALSE,
  followed_up      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACT NOTES
-- =============================================
CREATE TABLE contact_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACT TAGS
-- =============================================
CREATE TABLE contact_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  UNIQUE (contact_id, tag)
);

-- =============================================
-- AI FOLLOW-UPS
-- =============================================
CREATE TABLE ai_followups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  reason      TEXT,
  action      TEXT DEFAULT 'Send via Email',
  action_color TEXT DEFAULT 'var(--indigo)',
  priority    TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_followups_owner ON ai_followups(owner_id);

-- =============================================
-- UPDATED_AT trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (optional but recommended)
-- =============================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_followups  ENABLE ROW LEVEL SECURITY;

-- Since we use the service-role key server-side, no RLS policies needed.
-- Add them if you ever expose Supabase directly to the client.

-- =============================================
-- AUDIT LOGS (immutable — no UPDATE/DELETE)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,   -- clerk_user_id (profile may be deleted)
  action        TEXT        NOT NULL,   -- create | update | delete | generate
  resource_type TEXT        NOT NULL,   -- contact | event | followup | profile | tag | note
  resource_id   TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
