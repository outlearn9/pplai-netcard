-- Add username (slug) column to profiles for public card URLs: pplai.app/u/<username>
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Index for fast lookups by username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username) WHERE username IS NOT NULL;
