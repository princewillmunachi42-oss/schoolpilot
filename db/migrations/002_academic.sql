CREATE TABLE IF NOT EXISTS academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT academic_session_dates_valid
    CHECK (end_date > start_date),

  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS academic_sessions_school_id_idx
ON academic_sessions (school_id);

CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session_id UUID NOT NULL
    REFERENCES academic_sessions(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT term_dates_valid
    CHECK (end_date > start_date),

  UNIQUE (academic_session_id, name)
);

CREATE INDEX IF NOT EXISTS terms_school_id_idx
ON terms (school_id);

CREATE INDEX IF NOT EXISTS terms_session_id_idx
ON terms (academic_session_id);
