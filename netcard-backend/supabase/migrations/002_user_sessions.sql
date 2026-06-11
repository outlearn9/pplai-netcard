-- =============================================
-- USER SESSIONS
-- Tracks per-session analytics: device, browser,
-- session type, location, and usage duration.
-- =============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,            -- clerk_user_id
  profile_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  session_type    TEXT        NOT NULL             -- 'web' | 'mobile_web' | 'mobile_app' | 'tablet'
                              CHECK (session_type IN ('web', 'mobile_web', 'mobile_app', 'tablet')),
  browser         TEXT        NOT NULL DEFAULT 'other',  -- 'chrome'|'safari'|'firefox'|'edge'|'android'|'ios'|'other'
  device_type     TEXT        NOT NULL DEFAULT 'desktop', -- 'desktop'|'tablet'|'mobile'
  device_id       TEXT,                            -- fingerprint set by frontend (localStorage)
  os              TEXT,                            -- 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other'
  country         TEXT,                            -- from CF-IPCountry header
  region          TEXT,                            -- from CF-IPRegion  header
  city            TEXT,                            -- from CF-IPCity    header
  ip              TEXT,                            -- hashed for privacy
  user_agent      TEXT,                            -- raw UA string (truncated to 500 chars)
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_s      INTEGER                          -- computed on session end
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id      ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_started_at   ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS user_sessions_session_type ON user_sessions(session_type);
CREATE INDEX IF NOT EXISTS user_sessions_device_type  ON user_sessions(device_type);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
