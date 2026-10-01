CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  ca_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  exam_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score NUMERIC(5,2) GENERATED ALWAYS AS (ca_score + exam_score) STORED,
  grade TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT results_score_check
    CHECK (
      ca_score >= 0
      AND ca_score <= 40
      AND exam_score >= 0
      AND exam_score <= 60
    ),

  CONSTRAINT results_unique_student_subject
    UNIQUE (
      school_id,
      student_id,
      academic_session_id,
      term_id,
      subject_id
    )
);

CREATE INDEX IF NOT EXISTS results_student_idx
  ON results (school_id, student_id);

CREATE INDEX IF NOT EXISTS results_subject_idx
  ON results (school_id, subject_id);
