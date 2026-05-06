-- =============================================
-- Admin & community feature tables
-- Run in Supabase SQL Editor
-- =============================================

-- ── Team members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL,                    -- Clerk user id of the workspace owner
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  access      TEXT NOT NULL DEFAULT 'viewer'   -- 'admin' | 'editor' | 'viewer'
                CHECK (access IN ('admin','editor','viewer')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);

CREATE INDEX IF NOT EXISTS team_members_owner ON team_members(owner_id);

-- ── Support tickets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'help'
                CHECK (category IN ('bug','suggest','help','other')),
  message     TEXT NOT NULL,
  email       TEXT,                             -- optional reply-to override
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_owner  ON support_tickets(owner_id);
CREATE INDEX IF NOT EXISTS support_tickets_status ON support_tickets(status);

-- ── Suggestions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'feature'
                CHECK (category IN ('feature','improvement','bug','other')),
  up          INT  NOT NULL DEFAULT 0,
  down        INT  NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','planned','done','rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS suggestions_votes  ON suggestions((up - down) DESC);

-- ── Suggestion votes (one row per voter per suggestion) ───────────────────────
CREATE TABLE IF NOT EXISTS suggestion_votes (
  suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  voter_id      TEXT NOT NULL,
  vote          TEXT NOT NULL CHECK (vote IN ('up','down')),
  PRIMARY KEY (suggestion_id, voter_id)
);

-- ── Crash reports ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crash_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT,                             -- null for unauthenticated users
  error       TEXT NOT NULL,
  stack       TEXT,
  url         TEXT,
  ua          TEXT,                             -- user-agent
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crash_reports_created ON crash_reports(created_at DESC);
