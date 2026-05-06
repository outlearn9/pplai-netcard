-- =============================================
-- Admin users table (multi-user admin panel)
-- Run in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT UNIQUE NOT NULL,
  role                   TEXT NOT NULL DEFAULT 'view'
                           CHECK (role IN ('view', 'comment', 'admin')),
  added_by               TEXT,
  -- password_hash: bcrypt hash. NULL means default password '0000' applies.
  password_hash          TEXT,
  reset_token            TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_users_email ON admin_users(email);

-- Seed the two owner accounts with default password '0000'
-- Hash: bcryptjs.hashSync('0000', 10) = $2b$10$a.vNSltYmhHpCK5pqBSvJOtdPXmwcSteo9zFd5dBiq1o43C1D6Nme
INSERT INTO admin_users (email, role, added_by, password_hash) VALUES
  ('paras@pplai.app',   'admin', 'system', '$2b$10$a.vNSltYmhHpCK5pqBSvJOtdPXmwcSteo9zFd5dBiq1o43C1D6Nme'),
  ('contact@pplai.app', 'admin', 'system', '$2b$10$a.vNSltYmhHpCK5pqBSvJOtdPXmwcSteo9zFd5dBiq1o43C1D6Nme')
ON CONFLICT (email) DO UPDATE SET
  password_hash = COALESCE(admin_users.password_hash, EXCLUDED.password_hash);

-- Add columns to existing table if already created
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash          TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token            TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
