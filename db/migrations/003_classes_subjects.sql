CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session_id UUID NOT NULL
    REFERENCES academic_sessions(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50),
  capacity INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT class_capacity_valid
    CHECK (capacity IS NULL OR capacity > 0),

  UNIQUE (school_id, academic_session_id, name)
);

CREATE INDEX IF NOT EXISTS classes_school_id_idx
ON classes (school_id);

CREATE INDEX IF NOT EXISTS classes_session_id_idx
ON classes (academic_session_id);


CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (school_id, name),
  UNIQUE (school_id, code)
);

CREATE INDEX IF NOT EXISTS subjects_school_id_idx
ON subjects (school_id);
