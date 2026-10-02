CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  audience VARCHAR(30) NOT NULL DEFAULT 'all'
    CHECK (
      audience IN (
        'all',
        'teachers',
        'students',
        'parents'
      )
    ),

  status VARCHAR(20) NOT NULL DEFAULT 'published'
    CHECK (
      status IN (
        'draft',
        'published'
      )
    ),

  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS announcements_school_id_idx
  ON announcements(school_id);

CREATE INDEX IF NOT EXISTS announcements_school_status_idx
  ON announcements(school_id, status);

CREATE INDEX IF NOT EXISTS announcements_school_published_idx
  ON announcements(school_id, published_at DESC);	
