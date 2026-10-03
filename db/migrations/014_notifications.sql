CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES schools(id)
    ON DELETE CASCADE,

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,

  message TEXT NOT NULL,

  type VARCHAR(50) NOT NULL DEFAULT 'general',

  link TEXT,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notifications_title_not_empty
    CHECK (length(trim(title)) > 0),

  CONSTRAINT notifications_message_not_empty
    CHECK (length(trim(message)) > 0)
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
ON notifications (school_id, user_id);

CREATE INDEX IF NOT EXISTS notifications_unread_idx
ON notifications (school_id, user_id, is_read);

CREATE INDEX IF NOT EXISTS notifications_created_idx
ON notifications (school_id, user_id, created_at DESC);
