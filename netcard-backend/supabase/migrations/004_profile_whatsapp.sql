-- profiles: whatsapp (separate number for WhatsApp contact)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
