-- Venue type on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_type TEXT DEFAULT 'event'
  CHECK (venue_type IN ('event','workspace','travel','housing','gym','clubhouse','party'));

-- Meeting context columns on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_location TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_event_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_venue_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_context TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS met_highlights TEXT;
