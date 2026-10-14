BEGIN;

CREATE TABLE IF NOT EXISTS student_report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES schools(id) ON DELETE CASCADE,

  student_id UUID NOT NULL
    REFERENCES students(id) ON DELETE CASCADE,

  academic_session_id UUID NOT NULL
    REFERENCES academic_sessions(id) ON DELETE CASCADE,

  term_id UUID NOT NULL
    REFERENCES terms(id) ON DELETE CASCADE,

  teacher_comment TEXT,
  principal_comment TEXT,
  conduct_comment TEXT,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),

  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_report_cards_unique
    UNIQUE (school_id, student_id, academic_session_id, term_id),

  CONSTRAINT student_report_cards_publication_valid
    CHECK (
      (status = 'draft' AND published_at IS NULL)
      OR
      (status = 'published' AND published_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS student_report_cards_student_idx
  ON student_report_cards
    (school_id, student_id, academic_session_id, term_id);

CREATE INDEX IF NOT EXISTS student_report_cards_publication_idx
  ON student_report_cards
    (school_id, status, academic_session_id, term_id);

COMMIT;
