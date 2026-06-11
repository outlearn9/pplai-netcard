CREATE TABLE IF NOT EXISTS ticket_replies (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type  TEXT        NOT NULL CHECK (author_type IN ('admin', 'user')),
  author_email TEXT,
  body         TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_replies_created_at ON ticket_replies(created_at);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
