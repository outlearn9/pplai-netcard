-- =============================================
-- Migration 001 — Add columns missing from initial schema
-- Safe to run on an existing database (all IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- Run in Supabase SQL Editor
-- =============================================

-- profiles: web_url (used by QR vCard export)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS web_url TEXT;

-- contacts: meeting context (set by /api/contacts/scan and /api/contacts POST)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_at         TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_event_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_location   TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_venue_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source         TEXT;  -- 'qr_scan' | 'manual' | 'vcard' | 'url'

-- audit_logs: durable immutable audit trail (required by lib/audit.ts)
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  action        TEXT        NOT NULL,
  resource_type TEXT        NOT NULL,
  resource_id   TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
