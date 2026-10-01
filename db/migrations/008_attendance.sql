CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('present', 'absent', 'late', 'excused')
  ),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT attendance_records_unique_student_date
    UNIQUE (
      school_id,
      student_id,
      academic_session_id,
      term_id,
      attendance_date
    )
);

CREATE INDEX IF NOT EXISTS attendance_records_student_idx
  ON attendance_records (school_id, student_id);

CREATE INDEX IF NOT EXISTS attendance_records_date_idx
  ON attendance_records (school_id, attendance_date);
