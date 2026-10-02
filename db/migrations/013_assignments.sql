CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  class_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT assignments_school_id_fkey
    FOREIGN KEY (school_id)
    REFERENCES schools(id)
    ON DELETE CASCADE,

  CONSTRAINT assignments_staff_id_fkey
    FOREIGN KEY (staff_id)
    REFERENCES staff(id)
    ON DELETE CASCADE,

  CONSTRAINT assignments_class_id_fkey
    FOREIGN KEY (class_id)
    REFERENCES classes(id)
    ON DELETE CASCADE,

  CONSTRAINT assignments_subject_id_fkey
    FOREIGN KEY (subject_id)
    REFERENCES subjects(id)
    ON DELETE CASCADE,

  CONSTRAINT assignments_status_check
    CHECK (status IN ('draft', 'published')),

  CONSTRAINT assignments_title_not_empty
    CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS assignments_school_id_idx
  ON assignments(school_id);

CREATE INDEX IF NOT EXISTS assignments_staff_id_idx
  ON assignments(staff_id);

CREATE INDEX IF NOT EXISTS assignments_class_id_idx
  ON assignments(class_id);

CREATE INDEX IF NOT EXISTS assignments_subject_id_idx
  ON assignments(subject_id);

CREATE INDEX IF NOT EXISTS assignments_due_date_idx
  ON assignments(due_date);
