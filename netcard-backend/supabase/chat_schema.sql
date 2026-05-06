-- Chat: conversations & messages
-- Run this in your Supabase SQL editor after schema.sql

CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  unread_a        INTEGER NOT NULL DEFAULT 0,
  unread_b        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_a, participant_b),
  CHECK (participant_a < participant_b)  -- canonical: smaller UUID is always participant_a
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT,
  file_url        TEXT,
  file_name       TEXT,
  file_size       INTEGER,
  file_type       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  CHECK (content IS NOT NULL OR file_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conv_participant_a  ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conv_participant_b  ON conversations(participant_b);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- Supabase Storage bucket for chat files (run separately or via dashboard):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);
