CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  fee_name TEXT NOT NULL,
  amount_due NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'partial', 'paid', 'overdue', 'waived')
  ),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_fees_amount_check
    CHECK (
      amount_due >= 0
      AND amount_paid >= 0
      AND amount_paid <= amount_due
    )
);

CREATE INDEX IF NOT EXISTS student_fees_student_idx
  ON student_fees (school_id, student_id);

CREATE INDEX IF NOT EXISTS student_fees_session_term_idx
  ON student_fees (school_id, academic_session_id, term_id);
